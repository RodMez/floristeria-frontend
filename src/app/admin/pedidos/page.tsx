"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PedidoAdminResponse, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";
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
import { Eye, Package, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

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
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroSede, setFiltroSede] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pedidoACancelar, setPedidoACancelar] = useState<string | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoAdminResponse | null>(null);

  const { data, error, mutate } = useSWR<PedidoAdminResponse[]>(
    `${API_URL}/api/admin/pedidos`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const sedesUnicas = [...new Set((data ?? []).map((p) => p.sedeNombre))].sort();

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
        throw new Error(text ? JSON.parse(text).mensaje || text : "Error al actualizar");
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

  const generarPDF = (pedido: PedidoAdminResponse) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Floristeria", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Comprobante de Pedido", pageWidth / 2, y, { align: "center" });
    y += 12;

    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Pedido #${pedido.id}`, 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha: ${formatDate(pedido.creadoEn)}`, 20, y);
    y += 6;
    doc.text(`Estado: ${ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}`, 20, y);
    y += 6;
    doc.text(`Cliente: ${pedido.clienteNombre}`, 20, y);
    y += 6;
    doc.text(`Telefono: ${pedido.clienteTelefono}`, 20, y);
    y += 6;
    doc.text(`Email: ${pedido.clienteEmail}`, 20, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Informacion del Pago", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Referencia Wompi: ${pedido.referenciaPago || "—"}`, 20, y);
    y += 6;
    doc.text(`Metodo de Pago: ${pedido.metodoPago || "—"}`, 20, y);
    y += 6;
    doc.text(`Transaccion: ${pedido.transaccionId || "—"}`, 20, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Informacion de Entrega", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Sede: ${pedido.sedeNombre || "—"}`, 20, y);
    y += 6;
    if (pedido.direccionEntrega) {
      const dir = pedido.direccionEntrega;
      doc.text(`Direccion: ${dir.direccion}, ${dir.ciudad}`, 20, y);
      y += 6;
      if (dir.detalles) {
        doc.text(`Detalles: ${dir.detalles}`, 20, y);
        y += 6;
      }
    }
    if (pedido.zonaDomicilioNombre) {
      doc.text(`Zona de Envio: ${pedido.zonaDomicilioNombre}`, 20, y);
      y += 6;
    }
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Productos", 20, y);
    y += 7;

    const colProducto = 20;
    const colCant = 110;
    const colPrecio = 135;
    const colSubtotal = 165;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Producto", colProducto, y);
    doc.text("Cant", colCant, y);
    doc.text("Precio", colPrecio, y);
    doc.text("Subtotal", colSubtotal, y);
    y += 5;
    doc.line(20, y, pageWidth - 20, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    pedido.detalles?.forEach((d) => {
      const subtotal = d.cantidad * d.precioUnitario;
      const nombreLinea = doc.splitTextToSize(d.productoNombre, 85);
      doc.text(nombreLinea, colProducto, y);
      doc.text(String(d.cantidad), colCant, y);
      doc.text(formatCurrency(d.precioUnitario), colPrecio, y);
      doc.text(formatCurrency(subtotal), colSubtotal, y);
      y += nombreLinea.length * 5;
      if (d.notaPersonalizacion) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        const notaLinea = doc.splitTextToSize(`Nota: ${d.notaPersonalizacion}`, 85);
        doc.text(notaLinea, colProducto, y);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        y += notaLinea.length * 4;
      }
      y += 2;
    });

    y += 2;
    doc.line(20, y, pageWidth - 20, y);
    y += 7;

    if (pedido.costoEnvio && pedido.costoEnvio > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Costo de Envio (Zona: ${pedido.zonaDomicilioNombre || ""})`, 20, y);
      doc.text(formatCurrency(pedido.costoEnvio), pageWidth - 20, y, { align: "right" });
      y += 7;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Total: ${formatCurrency(pedido.total)}`, pageWidth - 20, y, { align: "right" });

    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Gracias por su compra", pageWidth / 2, y, { align: "center" });

    doc.save(`pedido-${pedido.id}.pdf`);
  };

  const pedidosFiltrados = [...(data ?? [])]
    .filter((p) => filtroEstado === "" || p.estado === filtroEstado)
    .filter((p) => filtroSede === "" || p.sedeNombre === filtroSede)
    .sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""));

  // Filtro de búsqueda local
  const pedidosConBusqueda = pedidosFiltrados.filter((p) =>
    p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clienteTelefono?.includes(searchTerm) ||
    p.metodoPago?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
          <p className="text-stone-500 text-sm mt-1">
            Administra y da seguimiento a los pedidos de tus clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={(v) => { if (v !== null) setFiltroEstado(v); }}>
            <SelectTrigger className="w-[160px] border-stone-300">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroSede} onValueChange={(v) => { if (v !== null) setFiltroSede(v); }}>
            <SelectTrigger className="w-[180px] border-emerald-300">
              <SelectValue placeholder="Filtrar sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las sedes</SelectItem>
              {sedesUnicas.map((sede) => (
                <SelectItem key={sede} value={sede}>
                  {sede}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, teléfono o método de pago..."
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
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Método Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                      {pedidosConBusqueda.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.id}</TableCell>
                <TableCell className="font-medium">{item.clienteNombre ?? "—"}</TableCell>
                <TableCell>{item.clienteTelefono ?? "—"}</TableCell>
                <TableCell>{item.sedeNombre ?? "—"}</TableCell>
                <TableCell>{item.metodoPago || "—"}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.estado}
                    onValueChange={(value) => {
                      if (value === null || value === item.estado) return;
                      if (value === "CANCELADO") {
                        setPedidoACancelar(item.id);
                      } else {
                        handleStatusChange(item.id, value);
                      }
                    }}
                    disabled={getOpcionesPermitidas(item.estado).length === 0}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-7 rounded-full border px-3 text-xs font-medium",
                        ORDER_STATUS_COLORS[item.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-700 border-stone-200",
                        getOpcionesPermitidas(item.estado).length > 0
                          ? "cursor-pointer hover:opacity-80"
                          : "cursor-default"
                      )}
                    >
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
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {formatDate(item.creadoEn)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPedidoSeleccionado(item)}
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={pedidoSeleccionado !== null}
        onOpenChange={(open) => {
          if (!open) setPedidoSeleccionado(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{pedidoSeleccionado?.id}</DialogTitle>
            <DialogDescription>
              {pedidoSeleccionado?.clienteNombre} —{" "}
              {formatDate(pedidoSeleccionado?.creadoEn ?? "")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Información del Pago
              </h4>
              <div className="bg-stone-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Referencia</span>
                  <span className="font-mono text-xs">
                    {pedidoSeleccionado?.referenciaPago || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Método</span>
                  <span className="font-medium capitalize">
                    {pedidoSeleccionado?.metodoPago || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Transacción</span>
                  <span className="font-mono text-xs">
                    {pedidoSeleccionado?.transaccionId || "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                  <span className="text-stone-500">Total</span>
                  <span className="font-bold">
                    {formatCurrency(pedidoSeleccionado?.total ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Información de Entrega
              </h4>
              <div className="bg-stone-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Alias</span>
                  <span className="font-medium">
                    {pedidoSeleccionado?.direccionEntrega?.alias || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Dirección</span>
                  <span className="text-right max-w-[60%]">
                    {pedidoSeleccionado?.direccionEntrega?.direccion || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ciudad</span>
                  <span>{pedidoSeleccionado?.direccionEntrega?.ciudad || "—"}</span>
                </div>
                {pedidoSeleccionado?.direccionEntrega?.detalles && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Detalles</span>
                    <span className="text-right max-w-[60%]">
                      {pedidoSeleccionado.direccionEntrega.detalles}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                  <span className="text-stone-500">Zona de Envío</span>
                  <span className="font-medium">
                    {pedidoSeleccionado?.zonaDomicilioNombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Costo de Envío</span>
                  <span className="font-medium">
                    {formatCurrency(pedidoSeleccionado?.costoEnvio ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Productos
              </h4>
              <div className="bg-stone-50 rounded-lg max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs text-right">Cant</TableHead>
                      <TableHead className="text-xs text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidoSeleccionado?.detalles?.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">
                          {d.productoNombre}
                          <span className="block text-xs text-stone-400 font-normal">
                            {d.productoSku}
                          </span>
                          {d.notaPersonalizacion && (
                            <span className="block text-xs text-stone-400 italic font-normal">
                              Nota: {d.notaPersonalizacion}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {d.cantidad}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatCurrency(d.precioUnitario)}
                        </TableCell>
                      </TableRow>
                    )) ?? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm text-stone-400 text-center py-4">
                          Sin productos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPedidoSeleccionado(null)}>
              Cerrar
            </Button>
            <Button
              onClick={() => pedidoSeleccionado && generarPDF(pedidoSeleccionado)}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Descargar Comprobante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
