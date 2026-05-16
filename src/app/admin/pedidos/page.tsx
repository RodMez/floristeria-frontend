"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PedidoResponse } from "@/types";
import Cookies from "js-cookie";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function PedidosPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const { data, error, mutate } = useSWR<PedidoResponse[]>(
    `${API_URL}/api/admin/pedidos`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const handleStatusChange = async (pedidoId: number, nuevoEstado: string) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${API_URL}/api/admin/pedidos/${pedidoId}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar los pedidos: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pedidosFiltrados =
    filtroEstado === "Todos"
      ? [...(data ?? [])].sort((a, b) => b.id - a.id)
      : [...(data ?? [])]
          .filter((p) => p.estado === filtroEstado)
          .sort((a, b) => b.id - a.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
          <p className="text-stone-500 text-sm mt-1">
            Administra y da seguimiento a los pedidos de tus clientes
          </p>
        </div>
        <Select value={filtroEstado} onValueChange={(v) => { if (v !== null) setFiltroEstado(v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Completado">Completado</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                      {pedidosFiltrados.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                <TableCell className="font-medium">{item.clienteNombre}</TableCell>
                <TableCell>{item.clienteTelefono}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.estado}
                    onValueChange={(value) => { if (value !== null) handleStatusChange(item.id, value); }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {formatDate(item.creadoEn)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
