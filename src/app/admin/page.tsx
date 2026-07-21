"use client";

import { useState } from "react";
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
import { Package, ArrowRight, StickyNote, MapPin } from "lucide-react";
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

const STATUS_BORDER_COLORS: Record<string, string> = {
  PENDIENTE_PAGO: "border-l-[var(--admin-muted-foreground)]/40",
  PAGADO: "border-l-[var(--admin-warning)]",
  EN_PREPARACION: "border-l-[var(--admin-info)]",
  EN_CAMINO: "border-l-[var(--admin-success)]",
  ENTREGADO: "border-l-[var(--admin-success)]",
  CANCELADO: "border-l-[var(--admin-danger)]",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminPage() {
  const [filtroEstado, setFiltroEstado] = useState<string>("");

  const { data, error, mutate } = useSWR<PedidoAdminResponse[]>(
    `${API_URL}/api/admin/pedidos`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const pedidosActivos = (data ?? [])
    .filter((p) => ["PAGADO", "EN_PREPARACION", "EN_CAMINO"].includes(p.estado))
    .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));

  const conteoPorEstado = {
    PAGADO: pedidosActivos.filter((p) => p.estado === "PAGADO").length,
    EN_PREPARACION: pedidosActivos.filter((p) => p.estado === "EN_PREPARACION")
      .length,
    EN_CAMINO: pedidosActivos.filter((p) => p.estado === "EN_CAMINO").length,
  };

  const pedidosMostrados = filtroEstado
    ? pedidosActivos.filter((p) => p.estado === filtroEstado)
    : pedidosActivos;

  const toggleFilter = (estado: string) => {
    setFiltroEstado((prev) => (prev === estado ? "" : estado));
  };

  const handleStatusChange = async (pedidoId: string, nuevoEstado: string) => {
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg">
          <p>Error al cargar los pedidos: {error.message}</p>
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
            Cargando pedidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-foreground)]">
            Pedidos en Curso
          </h1>
          <p className="text-[var(--admin-muted-foreground)] text-sm mt-1 font-heading italic">
            Centro de comando: gestiona los pedidos activos en tiempo real
          </p>
        </div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-heading font-semibold text-[var(--admin-success)] hover:text-[var(--admin-success-foreground)] transition-colors"
        >
          Ver todos los pedidos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFiltroEstado("")}
          className={`rounded-xl p-3 text-center shadow-sm border transition-all duration-200 ${filtroEstado === "" ? "bg-[var(--admin-canvas)] border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30 scale-105" : "bg-[var(--admin-canvas)] border-[var(--admin-border)] hover:border-[var(--admin-accent)]/50 hover:scale-[1.02]"} cursor-pointer`}
        >
          <p className="text-2xl font-bold text-[var(--admin-foreground)] font-heading">{pedidosActivos.length}</p>
          <p className="text-xs text-[var(--admin-muted-foreground)] font-heading">Todos</p>
        </button>
        <button
          onClick={() => toggleFilter("PAGADO")}
          className={`rounded-xl p-3 text-center shadow-sm border transition-all duration-200 ${filtroEstado === "PAGADO" ? "bg-[var(--admin-warning-soft)] border-[var(--admin-warning)] ring-2 ring-[var(--admin-warning)]/30 scale-105" : "bg-[var(--admin-warning-soft)] border-[var(--admin-border)] hover:border-[var(--admin-warning)]/50 hover:scale-[1.02]"} cursor-pointer`}
        >
          <p className="text-2xl font-bold text-[var(--admin-warning-foreground)] font-heading">{conteoPorEstado.PAGADO}</p>
          <p className="text-xs text-[var(--admin-warning-foreground)]/80 font-heading">Por preparar</p>
        </button>
        <button
          onClick={() => toggleFilter("EN_PREPARACION")}
          className={`rounded-xl p-3 text-center shadow-sm border transition-all duration-200 ${filtroEstado === "EN_PREPARACION" ? "bg-[var(--admin-info-soft)] border-[var(--admin-info)] ring-2 ring-[var(--admin-info)]/30 scale-105" : "bg-[var(--admin-info-soft)] border-[var(--admin-border)] hover:border-[var(--admin-info)]/50 hover:scale-[1.02]"} cursor-pointer`}
        >
          <p className="text-2xl font-bold text-[var(--admin-info-foreground)] font-heading">{conteoPorEstado.EN_PREPARACION}</p>
          <p className="text-xs text-[var(--admin-info-foreground)]/80 font-heading">En preparación</p>
        </button>
        <button
          onClick={() => toggleFilter("EN_CAMINO")}
          className={`rounded-xl p-3 text-center shadow-sm border transition-all duration-200 ${filtroEstado === "EN_CAMINO" ? "bg-[var(--admin-success-soft)] border-[var(--admin-success)] ring-2 ring-[var(--admin-success)]/30 scale-105" : "bg-[var(--admin-success-soft)] border-[var(--admin-border)] hover:border-[var(--admin-success)]/50 hover:scale-[1.02]"} cursor-pointer`}
        >
          <p className="text-2xl font-bold text-[var(--admin-success-foreground)] font-heading">{conteoPorEstado.EN_CAMINO}</p>
          <p className="text-xs text-[var(--admin-success-foreground)]/80 font-heading">En camino</p>
        </button>
      </div>

      {pedidosMostrados.length === 0 ? (
        <div className="text-center py-16 text-[var(--admin-muted-foreground)]">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--admin-warning-soft)] mb-4">
            <Package className="h-7 w-7 text-[var(--admin-accent)]" />
          </div>
            <p className="font-heading italic text-base">
              {filtroEstado
                ? `No hay pedidos en "${
                    ORDER_STATUS_LABELS[filtroEstado as keyof typeof ORDER_STATUS_LABELS]
                  }"`
                : "No hay pedidos activos por el momento"}
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosMostrados.map((pedido) => (
            <Card
              key={pedido.id}
              className={`group flex flex-col border-l-4 bg-[var(--admin-card)] border-[var(--admin-border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${STATUS_BORDER_COLORS[pedido.estado] ?? "border-l-[var(--admin-muted-foreground)]/40"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-[var(--admin-foreground)]">
                  <span>#{pedido.id}</span>
                  <Badge
                    className={`${ORDER_STATUS_COLORS[pedido.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-[var(--admin-canvas)] text-[var(--admin-foreground)] border-[var(--admin-border)]"} text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-300 group-hover:ring-2 group-hover:ring-current/30`}
                  >
                    <span className="size-2 rounded-full bg-current" />
                    {ORDER_STATUS_LABELS[
                      pedido.estado as keyof typeof ORDER_STATUS_LABELS
                    ] ?? pedido.estado}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--admin-muted-foreground)]">Cliente</span>
                  <span className="font-medium text-[var(--admin-foreground)]">
                    {pedido.clienteNombre ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--admin-muted-foreground)]">Sede</span>
                  <span className="text-[var(--admin-foreground)]">{pedido.sedeNombre ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--admin-muted-foreground)]">Total</span>
                  <span className="font-bold text-[var(--admin-foreground)]">
                    {formatCurrency(pedido.total)}
                  </span>
                </div>
                <div className="border-t border-[var(--admin-border)] pt-2 mt-2">
                  <p className="text-[11px] font-semibold text-[var(--admin-muted-foreground)] uppercase tracking-wider mb-1 font-heading">
                    Productos
                  </p>
                  <div className="max-h-[108px] overflow-y-auto space-y-1.5">
                    {pedido.detalles?.map((d, i) => (
                      <div key={i}>
                        <p className="text-xs text-[var(--admin-foreground)] flex items-baseline gap-1">
                          <span className="font-medium shrink-0">{d.cantidad}x</span>
                          <span className="truncate">{d.productoNombre}</span>
                        </p>
                        {d.notaPersonalizacion && (
                          <div className="flex items-baseline gap-1 ml-4 mt-0.5">
                            <StickyNote className="h-2.5 w-2.5 text-[var(--admin-muted-foreground)] shrink-0" />
                            <p className="text-[11px] text-[var(--admin-muted-foreground)] italic leading-tight">
                              {d.notaPersonalizacion}
                            </p>
                          </div>
                        )}
                      </div>
                    )) ?? <p className="text-xs text-[var(--admin-muted-foreground)] italic">Sin productos</p>}
                  </div>
                </div>
                {pedido.direccionEntrega && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-[var(--admin-muted-foreground)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--admin-muted-foreground)] break-words">
                      {pedido.direccionEntrega.direccion}
                      {pedido.zonaDomicilioNombre && (
                        <span className="text-[var(--admin-muted-foreground)]/70 ml-1">· {pedido.zonaDomicilioNombre}</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!value || value === pedido.estado) return;
                    handleStatusChange(pedido.id, value);
                  }}
                  disabled={
                    getOpcionesPermitidas(pedido.estado).length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__" disabled>
                      {ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}
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
