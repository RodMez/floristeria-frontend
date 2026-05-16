"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CategoriaResponse, CategoriaRequest } from "@/types";
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
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function CategoriasPage() {
  const { data: categorias, error, mutate } = useSWR<CategoriaResponse[]>(
    `${API_URL}/api/superadmin/categorias`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaResponse | null>(null);
  const [nombre, setNombre] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNew = () => {
    setEditingCategoria(null);
    setNombre("");
    setDialogOpen(true);
  };

  const handleEdit = (categoria: CategoriaResponse) => {
    setEditingCategoria(categoria);
    setNombre(categoria.nombre);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const token = Cookies.get("token");
    const payload: CategoriaRequest = { nombre };
    const isEditing = editingCategoria !== null;
    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/categorias/${editingCategoria.id}`
      : `${API_URL}/api/superadmin/categorias`;

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar la categoría");

      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoria: CategoriaResponse) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/categorias/${categoria.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      mutate();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar las categorías: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!categorias) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Tags className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-stone-500 py-8">
                  No hay categorías registradas
                </TableCell>
              </TableRow>
            )}
            {categorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell>{categoria.id}</TableCell>
                <TableCell className="font-medium">{categoria.nombre}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(categoria)}
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
              {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la categoría"
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
