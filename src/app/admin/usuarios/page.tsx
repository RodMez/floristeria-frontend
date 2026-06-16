"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface UsuarioForm {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  sedeId: number | null;
}

const emptyForm: UsuarioForm = {
  nombre: "",
  email: "",
  password: "",
  rol: "ADMIN",
  sedeId: null,
};

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioAdminResponse | null>(null);
  const [form, setForm] = useState<UsuarioForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);

  const { data: usuarios, error: usuariosError, mutate: mutateUsuarios } = useSWR<UsuarioAdminResponse[]>(
    `${API_URL}/api/superadmin/usuarios`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: sedes } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (dialogOpen) {
      if (editingUsuario) {
        setForm({
          nombre: editingUsuario.nombre,
          email: editingUsuario.email,
          password: "",
          rol: editingUsuario.rol,
          sedeId: editingUsuario.sedeId,
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [dialogOpen, editingUsuario]);

  const handleNew = () => {
    setEditingUsuario(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (usuario: UsuarioAdminResponse) => {
    setEditingUsuario(usuario);
    setDialogOpen(true);
  };

  const handleRolChange = (value: string | null) => {
    if (!value) return;
    const sedeId = value === "SUPERADMIN" ? null : form.sedeId;
    setForm({ ...form, rol: value, sedeId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const token = Cookies.get("token");
    const isEditing = editingUsuario !== null;

    const payload: UsuarioAdminRequest = {
      nombre: form.nombre,
      email: form.email,
      rol: form.rol,
      sedeId: form.rol === "SUPERADMIN" ? null : form.sedeId,
    };

    if (!isEditing || form.password.trim() !== "") {
      payload.password = form.password;
    }

    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/usuarios/${editingUsuario.id}`
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
        throw new Error(errData.message || "Error al guardar el usuario");
      }

      toast.success(isEditing ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      mutateUsuarios();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving user:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (usuario: UsuarioAdminResponse) => {
    if (!window.confirm(`¿Eliminar el usuario "${usuario.nombre}"?`)) return;

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al eliminar");
      }
      toast.success("Usuario eliminado correctamente");
      mutateUsuarios();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

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

  // Ordenamiento estable por ID descendente
  const sortedUsuarios = usuarios ? [...usuarios].sort((a, b) => b.id - a.id) : [];

  // Filtro de búsqueda local
  const usuariosFiltrados = sortedUsuarios.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.sedeNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toString().includes(searchTerm)
  );

  const isEditing = editingUsuario !== null;

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

      {/* Search Bar */}
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
                <TableCell colSpan={6} className="text-center text-stone-500 py-8">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            )}
            {usuariosFiltrados.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-mono text-sm">{usuario.id}</TableCell>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    usuario.rol === "SUPERADMIN"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña {isEditing && <span className="text-stone-400 text-xs">(dejar vacío para no cambiar)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={isEditing ? "••••••••" : "Contraseña"}
                disabled={isLoading}
                required={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.rol}
                onValueChange={handleRolChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.rol === "ADMIN" && (
              <div className="space-y-2">
                <Label>Sede</Label>
                <Select
                  value={form.sedeId?.toString() ?? ""}
                  onValueChange={(val) => setForm({ ...form, sedeId: Number(val) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id.toString()}>
                        {sede.nombre} — {sede.ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}
