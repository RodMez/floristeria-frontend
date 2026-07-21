"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetcher } from "@/lib/fetcher";
import { UsuarioAdminResponse, UsuarioAdminRequest, Sede } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Users, ShieldAlert, Store, LoaderCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import Cookies from "js-cookie";
import { useRequireSuperAdmin } from "@/lib/auth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const usuarioSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    email: z
      .string()
      .min(1, "El email es obligatorio")
      .email("El email no tiene un formato válido"),
    password: z.string().optional(),
    rol: z.enum(["ADMIN", "SUPERADMIN"], {
      message: "El rol es obligatorio",
    }),
    sedeId: z.number().nullable(),
  })
  .refine(
    (data) => data.rol === "SUPERADMIN" || data.sedeId !== null,
    { message: "La sede es obligatoria para el rol ADMIN", path: ["sedeId"] }
  );

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export default function UsuariosPage() {
  const { isLoading: isAuthLoading } = useRequireSuperAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] =
    useState<UsuarioAdminResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<UsuarioAdminResponse | null>(null);

  const {
    data: usuarios,
    error: usuariosError,
    mutate: mutateUsuarios,
  } = useSWR<UsuarioAdminResponse[]>(
    `${API_URL}/api/superadmin/usuarios`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: sedes } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      rol: "ADMIN",
      sedeId: null,
    },
  });

  const rolValue = watch("rol");
  const isEditing = editingUsuario !== null;

  useEffect(() => {
    if (rolValue === "SUPERADMIN") {
      setValue("sedeId", null);
    }
  }, [rolValue, setValue]);

  useEffect(() => {
    if (dialogOpen) {
      if (editingUsuario) {
        reset({
          nombre: editingUsuario.nombre,
          email: editingUsuario.email,
          password: "",
          rol: editingUsuario.rol as "ADMIN" | "SUPERADMIN",
          sedeId: editingUsuario.sedeId ?? null,
        });
      } else {
        reset({
          nombre: "",
          email: "",
          password: "",
          rol: "ADMIN",
          sedeId: null,
        });
      }
    }
  }, [dialogOpen, editingUsuario, reset]);

  const handleNew = () => {
    setEditingUsuario(null);
    setDialogOpen(true);
  };

  const handleEdit = (usuario: UsuarioAdminResponse) => {
    setEditingUsuario(usuario);
    setDialogOpen(true);
  };

  const onSubmit = async (data: UsuarioFormData) => {
    if (!isEditing && (!data.password || data.password.length < 8)) {
      setError("password", {
        message: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("token");

    const payload: UsuarioAdminRequest = {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      sedeId: data.rol === "SUPERADMIN" ? null : data.sedeId,
    };

    if (!isEditing || (data.password && data.password.trim() !== "")) {
      payload.password = data.password;
    }

    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/usuarios/${editingUsuario!.id}`
      : `${API_URL}/api/superadmin/usuarios`;

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(
          errData.mensaje || errData.message || "Error al guardar el usuario"
        );
      }

      toast.success(
        isEditing
          ? "Usuario actualizado correctamente"
          : "Usuario creado correctamente"
      );
      mutateUsuarios();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving user:", err);
      toast.error(
        `Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (usuario: UsuarioAdminResponse) => {
    setUsuarioToDelete(usuario);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;
    const usuario = usuarioToDelete;
    setUsuarioToDelete(null);

    const token = Cookies.get("token");
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/usuarios/${usuario.id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || errData.message || "Error al eliminar");
      }
      toast.success("Usuario eliminado correctamente");
      mutateUsuarios();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(
        `Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    }
  };

  if (isAuthLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[var(--admin-muted-foreground)]">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (usuariosError) {
    return (
      <div className="p-6">
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded">
          <p>Error al cargar los usuarios: {usuariosError.message}</p>
        </div>
      </div>
    );
  }

  if (!usuarios || !sedes) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-[var(--admin-muted-foreground)] animate-pulse" />
          <p className="text-[var(--admin-muted-foreground)]">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const sortedUsuarios = [...usuarios].sort((a, b) => b.id - a.id);

  const conteoRoles = {
    SUPERADMIN: sortedUsuarios.filter((u) => u.rol === "SUPERADMIN").length,
    ADMIN: sortedUsuarios.filter((u) => u.rol === "ADMIN").length,
  };

  const usuariosFiltrados = sortedUsuarios
    .filter((u) => filtroRol === "" || u.rol === filtroRol)
    .filter(
      (u) =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.sedeNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toString().includes(searchTerm)
    );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Usuarios"
        subtitle="Gestiona los usuarios del sistema"
        icon={Users}
        actions={
          <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFiltroRol("")}
          className={`rounded-xl px-4 py-2.5 text-center shadow-sm border transition-all duration-200 font-heading text-sm font-semibold ${filtroRol === "" ? "bg-[var(--admin-card)] border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30" : "bg-[var(--admin-canvas)] border-[var(--admin-border)] hover:border-[var(--admin-accent)]/50 hover:shadow-md hover:-translate-y-0.5"} cursor-pointer`}
        >
          <span className="text-[var(--admin-foreground)] font-bold">{sortedUsuarios.length}</span>
          <span className="text-[var(--admin-muted-foreground)] ml-1.5 font-bold">Todos</span>
        </button>
        <button
          onClick={() => setFiltroRol((prev) => (prev === "SUPERADMIN" ? "" : "SUPERADMIN"))}
          className={`rounded-xl px-4 py-2.5 text-center shadow-sm border transition-all duration-200 font-heading text-sm font-semibold ${filtroRol === "SUPERADMIN" ? "bg-[var(--color-brand-mustard)]/15 border-[var(--color-brand-mustard)] ring-2 ring-[var(--color-brand-mustard)]/30" : "bg-[var(--admin-canvas)] border-[var(--admin-border)] hover:border-[var(--color-brand-mustard)]/50 hover:shadow-md hover:-translate-y-0.5"} cursor-pointer`}
        >
          <span className="text-[var(--color-brand-mustard-dark)] font-bold">{conteoRoles.SUPERADMIN}</span>
          <span className="text-[var(--color-brand-mustard-dark)]/70 ml-1.5 font-bold">SUPERADMIN</span>
        </button>
        <button
          onClick={() => setFiltroRol((prev) => (prev === "ADMIN" ? "" : "ADMIN"))}
          className={`rounded-xl px-4 py-2.5 text-center shadow-sm border transition-all duration-200 font-heading text-sm font-semibold ${filtroRol === "ADMIN" ? "bg-[var(--color-brand-rose)]/20 border-[var(--color-brand-rose-dark)] ring-2 ring-[var(--color-brand-rose-dark)]/30" : "bg-[var(--admin-canvas)] border-[var(--admin-border)] hover:border-[var(--color-brand-rose-dark)]/50 hover:shadow-md hover:-translate-y-0.5"} cursor-pointer`}
        >
          <span className="text-[var(--color-brand-rose-dark)] font-bold">{conteoRoles.ADMIN}</span>
          <span className="text-[var(--color-brand-rose-dark)]/70 ml-1.5 font-bold">ADMIN</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email, rol, sede o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {usuariosFiltrados.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No hay usuarios registrados"
          description={searchTerm || filtroRol ? "Intenta con otros términos de búsqueda" : "Crea el primer usuario para empezar"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {usuariosFiltrados.map((usuario, index) => {
            const esSuperAdmin = usuario.rol === "SUPERADMIN";
            const avatarBg = esSuperAdmin
              ? "bg-[var(--color-brand-mustard)]"
              : "bg-[var(--color-brand-rose)]";

            return (
              <Card
                key={usuario.id}
                className={`border-l-4 border-l-[var(--color-brand-rose)] hover:border-l-[var(--admin-accent)] bg-[var(--admin-card)] border-[var(--admin-border)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${avatarBg} text-white text-sm font-bold font-heading shadow-sm`}>
                      {getInitials(usuario.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-heading font-semibold text-base text-[var(--admin-foreground)] truncate">
                            {usuario.nombre}
                          </h3>
                          <p className="text-sm text-[var(--admin-muted-foreground)] truncate mt-0.5">
                            {usuario.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {esSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-heading font-bold bg-[var(--color-brand-mustard)]/20 text-[var(--color-brand-mustard-dark)]">
                            <ShieldAlert className="h-3 w-3" />
                            SUPERADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-heading font-medium bg-[var(--color-brand-rose)]/20 text-[var(--color-brand-rose-dark)]">
                            <ShieldAlert className="h-3 w-3" />
                            ADMIN
                          </span>
                        )}
                        {usuario.sedeNombre && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-heading text-[var(--admin-muted-foreground)] bg-[var(--admin-canvas)] border border-[var(--admin-border)]">
                            <Store className="h-3 w-3" />
                            {usuario.sedeNombre}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                        onClick={() => handleEdit(usuario)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                        onClick={() => handleDelete(usuario)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[var(--admin-danger-foreground)]" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md border-t-4 border-t-[var(--color-brand-rose)] border-b-4 border-b-[var(--color-brand-rose)]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-5 text-[var(--color-brand-mustard)]" />
              <DialogTitle className="text-[var(--color-brand-mustard)]">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos del usuario."
                : "Crea un nuevo usuario para el sistema."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
                Nombre <span className="text-[var(--admin-danger-foreground)]">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Nombre completo"
                disabled={isLoading}
                {...register("nombre")}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                aria-invalid={errors.nombre ? "true" : undefined}
              />
              {errors.nombre && (
                <p className="text-xs text-[var(--admin-danger-foreground)]">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
                Email <span className="text-[var(--admin-danger-foreground)]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                {...register("email")}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                aria-invalid={errors.email ? "true" : undefined}
              />
              {errors.email && (
                <p className="text-xs text-[var(--admin-danger-foreground)]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
                Contraseña{" "}
                {isEditing && (
                  <span className="text-[var(--admin-muted-foreground)] text-xs font-normal">
                    (dejar vacío para no cambiar)
                  </span>
                )}
                {!isEditing && <span> *</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? "••••••••" : "Mínimo 8 caracteres"}
                disabled={isLoading}
                {...register("password")}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                aria-invalid={errors.password ? "true" : undefined}
              />
              {errors.password && (
                <p className="text-xs text-[var(--admin-danger-foreground)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">
                Rol <span className="text-[var(--admin-danger-foreground)]">*</span>
              </Label>
              <Controller
                name="rol"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.rol && (
                <p className="text-xs text-[var(--admin-danger-foreground)]">{errors.rol.message}</p>
              )}
            </div>

            {rolValue === "ADMIN" && (
              <div className="space-y-2">
                <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">
                  Sede <span className="text-[var(--admin-danger-foreground)]">*</span>
                </Label>
                <Controller
                  name="sedeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                      <SelectContent>
                        {sedes.map((sede) => (
                          <SelectItem
                            key={sede.id}
                            value={sede.id.toString()}
                          >
                            {sede.nombre} — {sede.ciudad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sedeId && (
                  <p className="text-xs text-[var(--admin-danger-foreground)]">
                    {errors.sedeId.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isLoading}
                className="border-[var(--color-brand-mustard)]/40 text-[var(--color-brand-mustard)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] disabled:opacity-50" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  "Guardar cambios"
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usuarioToDelete !== null} onOpenChange={(open) => { if (!open) setUsuarioToDelete(null); }}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el usuario &ldquo;{usuarioToDelete?.nombre}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioToDelete(null)}>
              No, volver
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}