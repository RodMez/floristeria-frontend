"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  PedidoAdminResponse,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminPage() {
  const { data, error, mutate } = useSWR<PedidoAdminResponse[]>(
    `${API_URL}/api/admin/pedidos`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const pedidosActivos = (data ?? [])
    .filter((p) => ["PAGADO", "EN_PREPARACION", "EN_CAMINO"].includes(p.estado))
    .sort((a, b) => a.id - b.id);

  const conteoPorEstado = {
    PAGADO: pedidosActivos.filter((p) => p.estado === "PAGADO").length,
    EN_PREPARACION: pedidosActivos.filter((p) => p.estado === "EN_PREPARACION")
      .length,
    EN_CAMINO: pedidosActivos.filter((p) => p.estado === "EN_CAMINO").length,
  };

  const handleStatusChange = async (pedidoId: number, nuevoEstado: string) => {
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
        const text = await res.text();
        throw new Error(
          text ? JSON.parse(text).mensaje || text : "Error al actualizar"
        );
      }

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

  const resumenProductos = (pedido: PedidoAdminResponse) => {
    const items =
      pedido.detalles?.slice(0, 3).map((d) => `${d.cantidad}x ${d.productoNombre}`) ?? [];
    const texto = items.join(", ");
    return pedido.detalles && pedido.detalles.length > 3
      ? `${texto} +${pedido.detalles.length - 3} más`
      : texto || "Sin productos";
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Pedidos en Curso
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Centro de comando: gestiona los pedidos activos en tiempo real
          </p>
        </div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver todos los pedidos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-w-md">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {conteoPorEstado.PAGADO}
          </p>
          <p className="text-xs text-amber-600">Por preparar</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {conteoPorEstado.EN_PREPARACION}
          </p>
          <p className="text-xs text-blue-600">En preparación</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {conteoPorEstado.EN_CAMINO}
          </p>
          <p className="text-xs text-purple-600">En camino</p>
        </div>
      </div>

      {pedidosActivos.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Package className="h-12 w-12 mx-auto mb-3" />
          <p>No hay pedidos activos por el momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosActivos.map((pedido) => (
            <Card key={pedido.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pedido #{pedido.id}</span>
                  <Badge
                    variant={
                      ORDER_STATUS_COLORS[
                        pedido.estado as keyof typeof ORDER_STATUS_COLORS
                      ] ?? "secondary"
                    }
                  >
                    {ORDER_STATUS_LABELS[
                      pedido.estado as keyof typeof ORDER_STATUS_LABELS
                    ] ?? pedido.estado}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Cliente</span>
                  <span className="font-medium">
                    {pedido.clienteNombre ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Sede</span>
                  <span>{pedido.sedeNombre ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total</span>
                  <span className="font-bold">
                    {formatCurrency(pedido.total)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-stone-400 truncate">
                    {resumenProductos(pedido)}
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Select
                  value={pedido.estado}
                  onValueChange={(value) => {
                    if (value === null || value === pedido.estado) return;
                    handleStatusChange(pedido.id, value);
                  }}
                  disabled={
                    getOpcionesPermitidas(pedido.estado).length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={pedido.estado}>
                      {ORDER_STATUS_LABELS[
                        pedido.estado as keyof typeof ORDER_STATUS_LABELS
                      ]}
                    </SelectItem>
                    {getOpcionesPermitidas(pedido.estado).map((status) => (
                      <SelectItem key={status} value={status}>
                        {ORDER_STATUS_LABELS[
                          status as keyof typeof ORDER_STATUS_LABELS
                        ]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
