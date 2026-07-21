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
import { ComplementosDialog } from "@/components/admin/ComplementosDialog";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flower2, Plus, Pencil, Trash2, Search, FileSpreadsheet, PackagePlus } from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRequireSuperAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductosPage() {
  const { isLoading } = useRequireSuperAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [exportando, setExportando] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState<ProductoResponse | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<ProductoResponse | null>(null);
  const [complementosProducto, setComplementosProducto] = useState<ProductoResponse | null>(null);

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

  const handleExport = async () => {
    setExportando(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${API_URL}/api/admin/productos-inventario/export-excel`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `productos_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel exportado correctamente");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Error al exportar Excel"}`
      );
    } finally {
      setExportando(false);
    }
  };

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
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg">
          <p>Error al cargar los productos: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!productos || !categorias) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Flower2 className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Cargando productos...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Flower2 className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Verificando permisos...
          </p>
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
      <AdminPageHeader
        title="Catálogo Maestro"
        subtitle="Gestiona los productos base del sistema"
        icon={Flower2}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={exportando} className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {exportando ? "Exportando..." : "Exportar Excel"}
            </Button>
            <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </>
        }
      />

      <AdminTableShell
        toolbar={
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
            <Input
              type="text"
              placeholder="Buscar por nombre, descripción, categoría o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-canvas)]/60 hover:bg-[var(--admin-canvas)]/60">
              <TableHead className="w-[100px] font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">SKU</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Imagen</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Nombre</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Categoría</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Descripción</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Complementos</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <AdminEmptyState
                    icon={Flower2}
                    title="No hay productos registrados"
                    description="Crea tu primer producto para empezar a poblar el catálogo."
                  />
                </TableCell>
              </TableRow>
            )}
            {productosFiltrados.map((producto) => (
              <TableRow key={producto.id} className="border-[var(--admin-border)] hover:bg-[var(--admin-warning-soft)]/40 transition-colors">
                <TableCell className="font-mono text-sm text-[var(--admin-foreground)]">{producto.sku || "Sin SKU"}</TableCell>
                <TableCell>
                  <Image
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    width={48}
                    height={48}
                    style={{ width: "auto", height: "auto" }}
                    className="object-cover rounded-lg ring-1 ring-[var(--admin-border)]"
                  />
                </TableCell>
                <TableCell className="font-medium text-[var(--admin-foreground)]">{producto.nombre}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {producto.categorias.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center rounded-full bg-[var(--admin-info-soft)] border border-[var(--admin-info)]/30 px-2.5 py-0.5 text-xs font-semibold font-heading text-[var(--admin-info-foreground)]"
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-[var(--admin-muted-foreground)]">
                  {producto.descripcion}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setComplementosProducto(producto)}
                    className="text-[var(--admin-success)] hover:text-[var(--admin-success-foreground)] hover:bg-[var(--admin-success-soft)]"
                  >
                    <PackagePlus className="h-4 w-4 mr-1" />
                    Complementos
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(producto)}
                      className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]"
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
      </AdminTableShell>

      <ProductDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        producto={productoToEdit}
        categorias={categorias}
        mutate={mutate}
      />

      <ComplementosDialog
        isOpen={complementosProducto !== null}
        onClose={() => setComplementosProducto(null)}
        productoId={complementosProducto?.id ?? 0}
        productoNombre={complementosProducto?.nombre ?? ""}
      />

      <Dialog open={productoToDelete !== null} onOpenChange={(open) => { if (!open) setProductoToDelete(null); }}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
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
