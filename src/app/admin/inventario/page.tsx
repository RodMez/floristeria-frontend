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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar el inventario: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando inventario...</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona el stock y precios de tus productos
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exportando}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {exportando ? "Exportando..." : "Exportar Excel"}
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Search Bar */}
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por producto, SKU o sede..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por Estado */}
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

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead className="w-[70px]">Imagen</TableHead>
              <TableHead className="w-[250px]">Producto</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Descuento</TableHead>
              <TableHead className="text-right">Precio Final</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventarioFiltrado.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.productoSku}</TableCell>
                <TableCell>
                  {item.productoImagenUrl ? (
                    <Image
                      src={item.productoImagenUrl}
                      alt={item.productoNombre}
                      width={40}
                      height={40}
                      style={{ width: "auto", height: "auto" }}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-stone-100 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-stone-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.productoNombre}</TableCell>
                <TableCell>{item.sedeNombre}</TableCell>
                <TableCell className="text-right">
                  {item.descuentoPorcentaje > 0 ? (
                    <span className="line-through text-stone-400 mr-2">
                      ${item.precio.toLocaleString("es-CO")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  {item.descuentoPorcentaje}%
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${item.precioFinal.toLocaleString("es-CO")}
                </TableCell>
                <TableCell className="text-right">{item.stock}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.disponible && item.stock > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.disponible && item.stock > 0 ? "Disponible" : "Agotado"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <EditInventarioDialog item={item} mutate={mutate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
