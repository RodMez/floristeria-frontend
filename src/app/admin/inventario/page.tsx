"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { InventarioResponse } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditInventarioDialog } from "@/components/admin/EditInventarioDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search, ImageIcon, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import Cookies from "js-cookie";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [exportando, setExportando] = useState(false);

  const { data, error, mutate } = useSWR<InventarioResponse[]>(
    `${API_URL}/api/admin/inventario`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg">
          <p>Error al cargar el inventario: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Cargando inventario...
          </p>
        </div>
      </div>
    );
  }

  // Ordenamiento estable por ID descendente
  const sortedData = data ? [...data].sort((a, b) => b.id - a.id) : [];

  // Filtro de búsqueda local + filtro por estado
  const inventarioFiltrado = sortedData.filter((item) => {
    const matchesSearch =
      (item.productoNombre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (item.productoSku?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (item.sedeNombre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    const itemEstado = item.disponible && item.stock > 0 ? "Disponible" : "Agotado";
    const matchesEstado = filtroEstado === "" || itemEstado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Inventario"
        subtitle="Gestiona el stock y precios de tus productos"
        icon={Package}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={exportando} className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {exportando ? "Exportando..." : "Exportar Excel"}
          </Button>
        }
      />

      <AdminTableShell
        toolbar={
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative max-w-md flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
              <Input
                type="text"
                placeholder="Buscar por producto, SKU o sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={(v) => { if (v !== null) setFiltroEstado(v); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Agotado">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-canvas)]/60 hover:bg-[var(--admin-canvas)]/60">
              <TableHead className="w-[100px] font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">SKU</TableHead>
              <TableHead className="w-[70px] font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Imagen</TableHead>
              <TableHead className="w-[250px] font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Producto</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Sede</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Precio</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Descuento</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Precio Final</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Stock</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Estado</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventarioFiltrado.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="p-0">
                  <AdminEmptyState
                    icon={Package}
                    title="No hay ítems en el inventario"
                    description="Ajusta los filtros de búsqueda o agrega stock a tus productos."
                  />
                </TableCell>
              </TableRow>
            )}
            {inventarioFiltrado.map((item) => {
              const disponible = item.disponible && item.stock > 0;
              return (
                <TableRow key={item.id} className="border-[var(--admin-border)] hover:bg-[var(--admin-warning-soft)]/40 transition-colors">
                  <TableCell className="font-mono text-sm text-[var(--admin-foreground)]">{item.productoSku}</TableCell>
                  <TableCell>
                    {item.productoImagenUrl ? (
                      <Image
                        src={item.productoImagenUrl}
                        alt={item.productoNombre}
                        width={40}
                        height={40}
                        style={{ width: "auto", height: "auto" }}
                        className="rounded-lg object-cover ring-1 ring-[var(--admin-border)]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--admin-canvas)] border border-[var(--admin-border)] flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-[var(--admin-muted-foreground)]" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-[var(--admin-foreground)]">{item.productoNombre}</TableCell>
                  <TableCell className="text-[var(--admin-foreground)]">{item.sedeNombre}</TableCell>
                  <TableCell className="text-right text-[var(--admin-muted-foreground)]">
                    {item.descuentoPorcentaje > 0 ? (
                      <span className="line-through">{item.precio.toLocaleString("es-CO")}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-[var(--admin-accent-hover)]">
                    {item.descuentoPorcentaje > 0 ? `${item.descuentoPorcentaje}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[var(--admin-foreground)]">
                    {item.precioFinal.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${disponible ? "text-[var(--admin-success-foreground)]" : "text-[var(--admin-danger-foreground)]"}`}>
                    {item.stock}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={disponible ? "success" : "danger"}
                      label={disponible ? "Disponible" : "Agotado"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditInventarioDialog item={item} mutate={mutate} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
