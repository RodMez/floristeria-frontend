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
import { Eye, Package, Search, Download, ShoppingBag, CreditCard, Truck, MessageSquare, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { loadCinzelFonts } from "@/lib/pdfFonts";

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
  const [exportandoExcel, setExportandoExcel] = useState(false);

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

  const handleExportExcel = async () => {
    setExportandoExcel(true);
    try {
      const token = Cookies.get("token");
      const params = new URLSearchParams();
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroSede) {
        const sedePedido = data?.find(p => p.sedeNombre === filtroSede);
        if (sedePedido) {
          params.append("sedeId", String(sedePedido.sedeId));
        }
      }

      const res = await fetch(
        `${API_URL}/api/admin/pedidos/export-excel?${params}`,
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
      a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      setExportandoExcel(false);
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

  const formatDateSolo = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const generarPDF = async (pedido: PedidoAdminResponse) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 15;

    // Brand colors
    const mustard = { r: 229, g: 190, b: 111 } as const;
    const mustardDark = { r: 139, g: 114, b: 48 } as const;
    const stone700 = { r: 68, g: 64, b: 60 } as const;
    const stone500 = { r: 120, g: 113, b: 108 } as const;
    const stone400 = { r: 168, g: 162, b: 158 } as const;
    const stone100 = { r: 245, g: 245, b: 244 } as const;
    const white = { r: 255, g: 255, b: 255 } as const;

    // Load Cinzel fonts
    const FONT = (await loadCinzelFonts(doc)) ? "Cinzel" : "Times-Roman";

    // Load logo
    let logoDataUrl: string | null = null;
    try {
      const configRes = await fetch(`${API_URL}/api/v1/configuracion`);
      if (configRes.ok) {
        const config = await configRes.json();
        const logoUrl = config?.logoUrl || "/tao-logo.png";
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const blob = await logoRes.blob();
          logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch {
      // Continue without logo
    }

    if (!logoDataUrl) {
      try {
        const logoRes = await fetch("/tao-logo.png");
        if (logoRes.ok) {
          const blob = await logoRes.blob();
          logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        // Continue without logo
      }
    }

    // Header with logo
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 15, y, 30, 30);
        y += 34;
      } catch {
        y += 5;
      }
    }

    doc.setFont(FONT, "bold");
    doc.setFontSize(16);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("Comprobante de Pedido", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(stone400.r, stone400.g, stone400.b);
    doc.text("TAO Boutique Floral", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setDrawColor(mustard.r, mustard.g, mustard.b);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Order info
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.setTextColor(stone700.r, stone700.g, stone700.b);
    doc.text(`Pedido #${pedido.id}`, margin, y);
    y += 7;

    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Fecha: ${formatDate(pedido.creadoEn)}`, margin, y);
    y += 5;
    doc.text(`Estado: ${ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}`, margin, y);
    y += 5;
    doc.text(`Cliente: ${pedido.clienteNombre}`, margin, y);
    y += 5;
    doc.text(`Teléfono: ${pedido.clienteTelefono}`, margin, y);
    y += 5;
    doc.text(`Email: ${pedido.clienteEmail}`, margin, y);
    y += 10;

    // ── Section: Pago ──
    doc.setFillColor(stone100.r, stone100.g, stone100.b);
    doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 33, 2, 2, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("Información del Pago", margin + 4, y + 2);
    doc.setDrawColor(mustard.r, mustard.g, mustard.b);
    doc.setLineWidth(0.3);
    doc.line(margin + 4, y + 5, pageWidth - margin - 4, y + 5);
    y += 10;
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Referencia:`, margin + 4, y);
    doc.setTextColor(stone700.r, stone700.g, stone700.b);
    doc.text(`${pedido.referenciaPago || "—"}`, margin + 55, y);
    y += 5;
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Método:`, margin + 4, y);
    doc.setTextColor(stone700.r, stone700.g, stone700.b);
    doc.text(`${pedido.metodoPago || "—"}`, margin + 55, y);
    y += 5;
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Transacción:`, margin + 4, y);
    doc.setTextColor(stone700.r, stone700.g, stone700.b);
    doc.text(`${pedido.transaccionId || "—"}`, margin + 55, y);
    y += 5;
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Total:`, margin + 4, y);
    doc.setFont(FONT, "bold");
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text(`${formatCurrency(pedido.total)}`, margin + 55, y);
    y += 14;

    // ── Section: Entrega ──
    doc.setFillColor(stone100.r, stone100.g, stone100.b);
    doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 38, 2, 2, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("Información de Entrega", margin + 4, y + 2);
    doc.setDrawColor(mustard.r, mustard.g, mustard.b);
    doc.line(margin + 4, y + 5, pageWidth - margin - 4, y + 5);
    y += 10;
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    if (pedido.direccionEntrega) {
      const dir = pedido.direccionEntrega;
      doc.text(`Dirección:`, margin + 4, y);
      doc.setTextColor(stone700.r, stone700.g, stone700.b);
      doc.text(`${dir.direccion}, ${dir.ciudad}`, margin + 55, y);
      y += 5;
      if (dir.detalles) {
        doc.setTextColor(stone500.r, stone500.g, stone500.b);
        doc.text(`Detalles:`, margin + 4, y);
        doc.setTextColor(stone700.r, stone700.g, stone700.b);
        const detalleLine = doc.splitTextToSize(dir.detalles, pageWidth - margin * 2 - 55);
        doc.text(detalleLine, margin + 55, y);
        y += detalleLine.length * 4;
      }
    }
    if (pedido.zonaDomicilioNombre) {
      doc.setTextColor(stone500.r, stone500.g, stone500.b);
      doc.text(`Zona de Envío:`, margin + 4, y);
      doc.setTextColor(stone700.r, stone700.g, stone700.b);
      doc.text(`${pedido.zonaDomicilioNombre}`, margin + 55, y);
      y += 5;
    }
    doc.setTextColor(stone500.r, stone500.g, stone500.b);
    doc.text(`Costo de Envío:`, margin + 4, y);
    doc.setTextColor(stone700.r, stone700.g, stone700.b);
    doc.text(`${formatCurrency(pedido.costoEnvio ?? 0)}`, margin + 55, y);
    y += 12;

    // ── Section: Productos ──
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("Productos", margin, y);
    y += 6;

    const colProducto = margin;
    const colCant = 115;
    const colPrecio = 140;
    const colSubtotal = 165;

    doc.setFillColor(mustard.r, mustard.g, mustard.b);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 7, "F");
    doc.setFontSize(8);
    doc.setFont(FONT, "bold");
    doc.setTextColor(white.r, white.g, white.b);
    doc.text("Producto", colProducto + 2, y);
    doc.text("Cant", colCant, y);
    doc.text("Precio", colPrecio, y);
    doc.text("Subtotal", colSubtotal, y);
    y += 6;

    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    pedido.detalles?.forEach((d, idx) => {
      const subtotal = d.cantidad * d.precioUnitario;

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 249);
        doc.rect(margin, y - 4, pageWidth - margin * 2, 6, "F");
      }

      doc.setTextColor(stone700.r, stone700.g, stone700.b);
      const nombreLinea = doc.splitTextToSize(d.productoNombre, 80);
      doc.text(nombreLinea, colProducto + 2, y);
      doc.setTextColor(stone500.r, stone500.g, stone500.b);
      doc.text(String(d.cantidad), colCant, y);
      doc.text(formatCurrency(d.precioUnitario), colPrecio, y);
      doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
      doc.setFont(FONT, "bold");
      doc.text(formatCurrency(subtotal), colSubtotal, y);
      doc.setFont(FONT, "normal");
      y += nombreLinea.length * 4;

      if (d.notaPersonalizacion) {
        doc.setFontSize(7);
        doc.setFont(FONT, "italic");
        doc.setTextColor(stone400.r, stone400.g, stone400.b);
        const notaLinea = doc.splitTextToSize(`Nota: ${d.notaPersonalizacion}`, 80);
        doc.text(notaLinea, colProducto + 2, y);
        doc.setFontSize(9);
        doc.setFont(FONT, "normal");
        y += notaLinea.length * 3.5;
      }
      y += 2;
    });

    y += 2;
    doc.setDrawColor(mustard.r, mustard.g, mustard.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Total
    doc.setFillColor(mustard.r, mustard.g, mustard.b);
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 12, 2, 2, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("Total:", margin + 4, y + 2);
    doc.text(formatCurrency(pedido.total), pageWidth - margin - 2, y + 2, { align: "right" });
    y += 18;

    // Footer
    doc.setDrawColor(mustard.r, mustard.g, mustard.b);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont(FONT, "italic");
    doc.setFontSize(9);
    doc.setTextColor(stone400.r, stone400.g, stone400.b);
    doc.text("Gracias por tu compra", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
    doc.text("TAO Boutique Floral", pageWidth / 2, y, { align: "center" });

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
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exportandoExcel}
            className="border-stone-300 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            {exportandoExcel ? "Exportando..." : "Exportar Excel"}
          </Button>
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
              <TableHead>Detalles</TableHead>
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
                  {formatDateSolo(item.creadoEn)}
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
        <DialogContent className="sm:max-w-lg border-stone-200 p-0 overflow-hidden">
          {/* Header branded */}
          <div className="bg-gradient-to-r from-[var(--color-brand-mustard)]/10 via-[var(--color-brand-rose)]/5 to-transparent px-6 pt-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-stone-800 text-lg">
                  Pedido #{pedidoSeleccionado?.id}
                </DialogTitle>
                <DialogDescription className="text-stone-500 mt-0.5">
                  {pedidoSeleccionado?.clienteNombre} &middot; {formatDate(pedidoSeleccionado?.creadoEn ?? "")}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className={`text-xs ${ORDER_STATUS_COLORS[pedidoSeleccionado?.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-700"}`}
                  >
                    {ORDER_STATUS_LABELS[pedidoSeleccionado?.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedidoSeleccionado?.estado}
                  </Badge>
                  <span className="text-xs text-stone-400">{pedidoSeleccionado?.clienteTelefono}</span>
                  <span className="text-xs text-stone-400">{pedidoSeleccionado?.clienteEmail}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Sección 1: Información del Pago */}
            <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-[var(--color-brand-mustard-dark)]" />
                Información del Pago
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Referencia</span>
                  <span className="font-mono text-xs text-stone-600 break-all">
                    {pedidoSeleccionado?.referenciaPago || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Método</span>
                  <span className="font-medium capitalize text-stone-700">
                    {pedidoSeleccionado?.metodoPago || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Transacción</span>
                  <span className="font-mono text-xs text-stone-600 break-all">
                    {pedidoSeleccionado?.transaccionId || "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2">
                  <span className="text-stone-500 font-medium">Total</span>
                  <span className="font-bold text-[var(--color-brand-mustard-dark)]">
                    {formatCurrency(pedidoSeleccionado?.total ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sección 2: Información de Entrega */}
            <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center gap-1.5">
                <Truck className="size-3.5 text-[var(--color-brand-mustard-dark)]" />
                Información de Entrega
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Alias</span>
                  <span className="font-medium text-stone-700">
                    {pedidoSeleccionado?.direccionEntrega?.alias || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Dirección</span>
                  <span className="text-right max-w-[60%] break-words text-stone-600">
                    {pedidoSeleccionado?.direccionEntrega?.direccion || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Ciudad</span>
                  <span className="text-stone-600">{pedidoSeleccionado?.direccionEntrega?.ciudad || "—"}</span>
                </div>
                {pedidoSeleccionado?.direccionEntrega?.detalles && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Detalles</span>
                    <span className="text-right max-w-[60%] break-words text-stone-600">
                      {pedidoSeleccionado.direccionEntrega.detalles}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-2">
                  <span className="text-stone-400">Zona de Envío</span>
                  <span className="font-medium text-stone-700">
                    {pedidoSeleccionado?.zonaDomicilioNombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Costo de Envío</span>
                  <span className="font-medium text-stone-700">
                    {formatCurrency(pedidoSeleccionado?.costoEnvio ?? 0)}
                  </span>
                </div>
                {pedidoSeleccionado?.notasEntrega && (
                  <div className="flex justify-between border-t border-stone-200 pt-2">
                    <span className="text-stone-400">Notas de Entrega</span>
                    <span className="text-right max-w-[60%] break-words text-stone-600">
                      {pedidoSeleccionado.notasEntrega}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección 3: Productos */}
            <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center gap-1.5">
                <Package className="size-3.5 text-[var(--color-brand-mustard-dark)]" />
                Productos
              </h4>
              <div className="max-h-[220px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stone-200 hover:bg-transparent">
                      <TableHead className="text-xs text-stone-400">Producto</TableHead>
                      <TableHead className="text-xs text-right text-stone-400">Cant</TableHead>
                      <TableHead className="text-xs text-right text-stone-400">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidoSeleccionado?.detalles?.map((d, i) => (
                      <TableRow key={i} className={`border-stone-100 ${i % 2 === 0 ? "bg-white/50" : "bg-stone-50/30"}`}>
                        <TableCell className="text-sm font-medium text-stone-700 py-2 whitespace-normal">
                          {d.productoNombre}
                          <span className="block text-xs text-stone-400 font-normal">
                            {d.productoSku}
                          </span>
                          {d.notaPersonalizacion && (
                            <span className="flex items-center gap-1 text-xs text-[var(--color-brand-rose)] italic font-normal mt-0.5 break-words">
                              <MessageSquare className="size-3 shrink-0" />
                              {d.notaPersonalizacion}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right text-stone-600 py-2">
                          {d.cantidad}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-stone-700 py-2">
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

          <DialogFooter className="px-6 pb-5 border-t border-stone-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setPedidoSeleccionado(null)}
              className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => pedidoSeleccionado && generarPDF(pedidoSeleccionado)}
              className="gap-1.5 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
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
