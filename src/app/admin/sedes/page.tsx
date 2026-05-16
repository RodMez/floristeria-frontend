"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
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
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
  const { data: sedes, error, mutate } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);

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

      if (!res.ok) throw new Error("Error al guardar la sede");

      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving sede:", err);
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
      if (!res.ok) throw new Error("Error al eliminar");
      mutate();
    } catch (err) {
      console.error("Error deleting sede:", err);
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
            {sedes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-stone-500 py-8">
                  No hay sedes registradas
                </TableCell>
              </TableRow>
            )}
            {sedes.map((sede) => (
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
                onChange={(e) => setForm({ ...form, telefonoWhatsapp: e.target.value })}
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
