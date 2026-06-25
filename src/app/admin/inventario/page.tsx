"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { InventarioResponse } from "@/types";
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
import { EditInventarioDialog } from "@/components/admin/EditInventarioDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search, ImageIcon } from "lucide-react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const { data, error, mutate } = useSWR<InventarioResponse[]>(
    `${API_URL}/api/admin/inventario`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

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
      item.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sedeNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm);

    const itemEstado = item.disponible && item.stock > 0 ? "Disponible" : "Agotado";
    const matchesEstado = filtroEstado === "Todos" || itemEstado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
        <p className="text-stone-500 text-sm mt-1">
          Gestiona el stock y precios de tus productos
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Search Bar */}
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por producto, sede o ID..."
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
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Disponible">Disponible</SelectItem>
            <SelectItem value="Agotado">Agotado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[70px]">Imagen</TableHead>
              <TableHead className="w-[250px]">Producto</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventarioFiltrado.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.id}</TableCell>
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
                  ${item.precio.toLocaleString("es-CO")}
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
