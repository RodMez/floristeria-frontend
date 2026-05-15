"use client";

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
import { Button } from "@/components/ui/button";
import { EditInventarioDialog } from "@/components/admin/EditInventarioDialog";
import { Package } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function InventarioPage() {
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
        <p className="text-stone-500 text-sm mt-1">
          Gestiona el stock y precios de tus productos
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Producto</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
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
