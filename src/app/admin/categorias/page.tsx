"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CategoriaResponse, CategoriaRequest } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tags, Plus, Pencil, Trash2, Search, Eye, EyeOff } from "lucide-react";
import Cookies from "js-cookie";
import { useRequireSuperAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function CategoriasPage() {
  const { isLoading: isCheckingPermissions } = useRequireSuperAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaResponse | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("CATALOGO");
  const [mostrarEnCatalogo, setMostrarEnCatalogo] = useState(true);
  const [orden, setOrden] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaResponse | null>(null);

  const { data: categorias, error, mutate } = useSWR<CategoriaResponse[]>(
    `${API_URL}/api/superadmin/categorias`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleNew = () => {
    setEditingCategoria(null);
    setNombre("");
    setTipo("CATALOGO");
    setMostrarEnCatalogo(true);
    setOrden("");
    setDialogOpen(true);
  };

  const handleEdit = (categoria: CategoriaResponse) => {
    setEditingCategoria(categoria);
    setNombre(categoria.nombre);
    setTipo(categoria.tipo || "CATALOGO");
    setMostrarEnCatalogo(categoria.mostrarEnCatalogo ?? true);
    setOrden(categoria.orden ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const token = Cookies.get("token");
    const payload: CategoriaRequest = {
      nombre,
      tipo,
      mostrarEnCatalogo,
      orden: typeof orden === "string" ? 0 : orden,
    };
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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar la categoría");
      }

      toast.success(isEditing ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (categoria: CategoriaResponse) => {
    setCategoriaToDelete(categoria);
  };

  const confirmDelete = async () => {
    if (!categoriaToDelete) return;
    const categoria = categoriaToDelete;
    setCategoriaToDelete(null);

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/categorias/${categoria.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || errData.message || "Error al eliminar");
      }
      toast.success("Categoría eliminada correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  if (isCheckingPermissions) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-stone-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

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

  const sortedCategorias = categorias ? [...categorias].sort((a, b) => b.id - a.id) : [];

  const categoriasFiltradas = sortedCategorias.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString().includes(searchTerm)
  );

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

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o ID..."
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
              <TableHead>Tipo</TableHead>
              <TableHead>Catálogo</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-stone-500 py-8">
                  No hay categorías registradas
                </TableCell>
              </TableRow>
            )}
            {categoriasFiltradas.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell>{categoria.id}</TableCell>
                <TableCell className="font-medium">{categoria.nombre}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    categoria.tipo === "ADICIONAL"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-stone-100 text-stone-700"
                  }`}>
                    {categoria.tipo === "ADICIONAL" ? "ADICIONAL" : "CATÁLOGO"}
                  </span>
                </TableCell>
                <TableCell>
                  {(categoria.mostrarEnCatalogo ?? true) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Eye className="h-3.5 w-3.5" /> Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                      <EyeOff className="h-3.5 w-3.5" /> Oculto
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-stone-500">{categoria.orden ?? 0}</TableCell>
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

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => v && setTipo(v)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CATALOGO">Catálogo</SelectItem>
                  <SelectItem value="ADICIONAL">Adicional</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-stone-400">
                ADICIONAL: productos que se muestran como complementos en la página de detalle.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mostrar-en-catalogo">Mostrar en catálogo</Label>
                <p className="text-xs text-stone-400">
                  Si está desactivado, los productos de esta categoría no aparecen en el listado principal.
                </p>
              </div>
              <Switch
                id="mostrar-en-catalogo"
                checked={mostrarEnCatalogo}
                onCheckedChange={setMostrarEnCatalogo}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                value={orden}
                onChange={(e) => setOrden(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={isLoading}
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

      <Dialog open={categoriaToDelete !== null} onOpenChange={(open) => { if (!open) setCategoriaToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la categoría &ldquo;{categoriaToDelete?.nombre}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaToDelete(null)}>
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
