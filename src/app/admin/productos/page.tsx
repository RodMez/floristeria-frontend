"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoResponse, CategoriaResponse } from "@/types";
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
import { ProductDialog } from "@/components/admin/ProductDialog";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flower2, Plus, Pencil, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState<ProductoResponse | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<ProductoResponse | null>(null);

  const { data: productos, error, mutate } = useSWR<ProductoResponse[]>(
    `${API_URL}/api/superadmin/productos`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: categorias } = useSWR<CategoriaResponse[]>(
    `${API_URL}/api/superadmin/categorias`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleNew = () => {
    setProductoToEdit(null);
    setDialogOpen(true);
  };

  const handleEdit = (producto: ProductoResponse) => {
    setProductoToEdit(producto);
    setDialogOpen(true);
  };

  const handleDelete = (producto: ProductoResponse) => {
    setProductoToDelete(producto);
  };

  const confirmDelete = async () => {
    if (!productoToDelete) return;
    const producto = productoToDelete;
    setProductoToDelete(null);

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/productos/${producto.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || errData.message || "Error al eliminar");
      }
      toast.success("Producto eliminado correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar los productos: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!productos || !categorias) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Flower2 className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Ordenamiento estable por ID descendente
  const sortedProductos = productos ? [...productos].sort((a, b) => b.id - a.id) : [];

  // Filtro de búsqueda local
  const productosFiltrados = sortedProductos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categorias.some((cat) => cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Catálogo Maestro</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona los productos base del sistema
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, descripción, categoría o SKU..."
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
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-stone-500 py-8">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            )}
            {productosFiltrados.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-mono text-sm">{producto.sku || "Sin SKU"}</TableCell>
                <TableCell>
                  <Image
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    width={48}
                    height={48}
                    style={{ width: "auto", height: "auto" }}
                    className="object-cover rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">{producto.nombre}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {producto.categorias.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800"
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {producto.descripcion}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(producto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(producto)}
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

      <ProductDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        producto={productoToEdit}
        categorias={categorias}
        mutate={mutate}
      />

      <Dialog open={productoToDelete !== null} onOpenChange={(open) => { if (!open) setProductoToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el producto &ldquo;{productoToDelete?.nombre}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductoToDelete(null)}>
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
