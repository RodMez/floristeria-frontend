"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoResponse, CategoriaResponse } from "@/types";
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
import { Flower2, Plus, Pencil, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductosPage() {
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState<ProductoResponse | null>(null);

  const handleNew = () => {
    setProductoToEdit(null);
    setDialogOpen(true);
  };

  const handleEdit = (producto: ProductoResponse) => {
    setProductoToEdit(producto);
    setDialogOpen(true);
  };

  const handleDelete = async (producto: ProductoResponse) => {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/productos/${producto.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      mutate();
    } catch (err) {
      console.error("Error deleting product:", err);
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

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-stone-500 py-8">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            )}
            {productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>
                  <img
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    className="w-12 h-12 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">{producto.nombre}</TableCell>
                <TableCell>{producto.categoriaNombre}</TableCell>
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
    </div>
  );
}
