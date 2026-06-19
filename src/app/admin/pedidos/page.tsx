"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PedidoResponse, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import Cookies from "js-cookie";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getOpcionesPermitidas(estadoActual: string): string[] {
  switch (estadoActual) {
    case "PENDIENTE_PAGO":
      return ["CANCELADO"];
    case "PAGADO":
      return ["EN_PREPARACION"];
    case "EN_PREPARACION":
      return ["EN_CAMINO"];
    case "EN_CAMINO":
      return ["ENTREGADO"];
    case "ENTREGADO":
    case "CANCELADO":
      return [];
    default:
      return [];
  }
}

export default function PedidosPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [pedidoACancelar, setPedidoACancelar] = useState<number | null>(null);

  const { data, error, mutate } = useSWR<PedidoResponse[]>(
    `${API_URL}/api/admin/pedidos`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const handleStatusChange = async (pedidoId: number, nuevoEstado: string) => {
    if (nuevoEstado === "CANCELADO") {
      setPedidoACancelar(pedidoId);
      return;
    }
    const toastId = toast.loading("Actualizando estado...");
    try {
      const token = Cookies.get("token");
      const res = await fetch(
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

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const errData = text ? JSON.parse(text) : {};
        throw new Error(errData.message || `Error ${res.status}`);
      }

      const text = await res.text().catch(() => "");
      const data = text ? JSON.parse(text) : {};

      toast.success("Estado actualizado correctamente", { id: toastId });
      mutate();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
        { id: toastId }
      );
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

  // Filtro de búsqueda local
  const pedidosConBusqueda = pedidosFiltrados.filter((p) =>
    p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clienteTelefono.includes(searchTerm) ||
    p.id.toString().includes(searchTerm)
  );

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
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, teléfono o ID..."
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
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                      {pedidosConBusqueda.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                <TableCell className="font-medium">{item.clienteNombre}</TableCell>
                <TableCell>{item.clienteTelefono}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Badge variant={ORDER_STATUS_COLORS[item.estado as keyof typeof ORDER_STATUS_COLORS] ?? "secondary"}>
                      {ORDER_STATUS_LABELS[item.estado as keyof typeof ORDER_STATUS_LABELS] ?? item.estado}
                    </Badge>
                    <Select
                      value={item.estado}
                      onValueChange={(value) => { if (value !== null && value !== item.estado) handleStatusChange(item.id, value); }}
                      disabled={getOpcionesPermitidas(item.estado).length === 0}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={item.estado}>
                          {ORDER_STATUS_LABELS[item.estado as keyof typeof ORDER_STATUS_LABELS]}
                        </SelectItem>
                        {getOpcionesPermitidas(item.estado).map((status) => (
                          <SelectItem key={status} value={status}>
                            {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {formatDate(item.creadoEn)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={pedidoACancelar !== null}
        onOpenChange={(open) => {
          if (!open) setPedidoACancelar(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cancelar el pedido #{pedidoACancelar}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPedidoACancelar(null)}>
              No, volver
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pedidoACancelar !== null) {
                  const id = pedidoACancelar;
                  setPedidoACancelar(null);
                  handleStatusChange(id, "CANCELADO");
                }
              }}
            >
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
