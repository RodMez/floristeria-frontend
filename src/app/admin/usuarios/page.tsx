"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetcher } from "@/lib/fetcher";
import { UsuarioAdminResponse, UsuarioAdminRequest, Sede } from "@/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { useRequireSuperAdmin } from "@/lib/auth";

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
          <p className="text-stone-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (usuariosError) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar los usuarios: {usuariosError.message}</p>
        </div>
      </div>
    );
  }

  if (!usuarios || !sedes) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const sortedUsuarios = usuarios
    ? [...usuarios].sort((a, b) => b.id - a.id)
    : [];

  const usuariosFiltrados = sortedUsuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sedeNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Usuarios</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email, rol, sede o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-stone-500 py-8"
                >
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            )}
            {usuariosFiltrados.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-mono text-sm">
                  {usuario.id}
                </TableCell>
                <TableCell className="font-medium">
                  {usuario.nombre}
                </TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      usuario.rol === "SUPERADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </TableCell>
                <TableCell>{usuario.sedeNombre ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(usuario)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Nombre completo"
                disabled={isLoading}
                {...register("nombre")}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña{" "}
                {isEditing && (
                  <span className="text-stone-400 text-xs">
                    (dejar vacío para no cambiar)
                  </span>
                )}
                {!isEditing && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? "••••••••" : "Mínimo 8 caracteres"}
                disabled={isLoading}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Rol <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="rol"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
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
                <p className="text-xs text-red-500">{errors.rol.message}</p>
              )}
            </div>

            {rolValue === "ADMIN" && (
              <div className="space-y-2">
                <Label>
                  Sede <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="sedeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full">
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
                  <p className="text-xs text-red-500">
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
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usuarioToDelete !== null} onOpenChange={(open) => { if (!open) setUsuarioToDelete(null); }}>
        <DialogContent>
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
