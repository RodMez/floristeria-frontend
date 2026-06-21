"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
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
import { Building2, Plus, Pencil, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const sedeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  telefonoWhatsapp: z.string().regex(/^[0-9+ ]+$/, "Solo se permiten números, espacios y el signo +"),
});

interface SedeForm {
  nombre: string;
  ciudad: string;
  telefonoWhatsapp: string;
}

const emptyForm: SedeForm = {
  nombre: "",
  ciudad: "",
  telefonoWhatsapp: "",
};

export default function SedesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);

  const { data: sedes, error, mutate } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleNew = () => {
    setEditingSede(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede);
    setForm({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      telefonoWhatsapp: sede.telefonoWhatsapp,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = sedeSchema.safeParse(form);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Error de validación";
      toast.error(firstError);
      return;
    }

    setIsLoading(true);

    const token = Cookies.get("token");
    const isEditing = editingSede !== null;
    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/sedes/${editingSede.id}`
      : `${API_URL}/api/superadmin/sedes`;

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar la sede");
      }

      toast.success(isEditing ? "Sede actualizada correctamente" : "Sede creada correctamente");
      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving sede:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sede: Sede) => {
    if (!window.confirm(`¿Eliminar la sede "${sede.nombre}"?`)) return;

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/sedes/${sede.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al eliminar");
      }
      toast.success("Sede eliminada correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting sede:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar las sedes: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!sedes) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  // Ordenamiento estable por ID descendente
  const sortedSedes = sedes ? [...sedes].sort((a, b) => b.id - a.id) : [];

  // Filtro de búsqueda local
  const sedesFiltradas = sortedSedes.filter((s) =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telefonoWhatsapp.includes(searchTerm) ||
    s.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Sedes</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona las sedes de la floristería
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sede
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, ciudad, WhatsApp o ID..."
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
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sedesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-stone-500 py-8">
                  No hay sedes registradas
                </TableCell>
              </TableRow>
            )}
            {sedesFiltradas.map((sede) => (
              <TableRow key={sede.id}>
                <TableCell>{sede.id}</TableCell>
                <TableCell className="font-medium">{sede.nombre}</TableCell>
                <TableCell>{sede.ciudad}</TableCell>
                <TableCell>{sede.telefonoWhatsapp}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(sede)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sede)}
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
              {editingSede ? "Editar Sede" : "Nueva Sede"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre de la sede"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                placeholder="Ciudad"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefonoWhatsapp">WhatsApp</Label>
              <Input
                id="telefonoWhatsapp"
                value={form.telefonoWhatsapp}
                onChange={(e) => setForm({ ...form, telefonoWhatsapp: e.target.value.replace(/[^0-9+ ]/g, "") })}
                placeholder="Ej: +57 300 1234567"
                disabled={isLoading}
                required
              />
            </div>
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
