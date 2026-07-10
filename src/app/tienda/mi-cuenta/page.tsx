"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { fetcher, authFetch, obtenerPerfil } from "@/lib/fetcher";
import {
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
  actualizarPerfil,
} from "@/lib/fetcher";
import {
  PedidoHistorial,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ConfiguracionTiendaDTO,
  DireccionResponse,
  DireccionRequest,
  Sede,
  ZonaDomicilioResponse,
  ClientePerfilResponse,
} from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LoaderIcon,
  Package,
  UserIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Eye,
  Download,
  CreditCard,
  Truck,
  StickyNote,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import ReseñasModal from "@/components/reseñas/ReseñasModal";

const API_PEDIDOS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`;
const API_DIRECCIONES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;
const API_SEDES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  PENDIENTE_PAGO: "border-l-stone-400",
  PAGADO: "border-l-amber-500",
  EN_PREPARACION: "border-l-blue-500 animate-pulse",
  EN_CAMINO: "border-l-purple-500 animate-pulse",
  ENTREGADO: "border-l-emerald-500",
  CANCELADO: "border-l-red-500",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDIENTE_PAGO: "bg-stone-400",
  PAGADO: "bg-amber-500",
  EN_PREPARACION: "bg-blue-500",
  EN_CAMINO: "bg-purple-500",
  ENTREGADO: "bg-emerald-500",
  CANCELADO: "bg-red-500",
};

async function generarPDF(pedido: PedidoHistorial) {
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

  // Load logo from config
  let logoDataUrl: string | null = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${apiUrl}/api/v1/configuracion`);
    if (res.ok) {
      const config = await res.json();
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

  // Fallback to local logo
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text("Comprobante de Pedido", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(stone400.r, stone400.g, stone400.b);
  doc.text("TAO Boutique Floral", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Mustard separator line
  doc.setDrawColor(mustard.r, mustard.g, mustard.b);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Order info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(stone700.r, stone700.g, stone700.b);
  doc.text(`Pedido #${pedido.id}`, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(stone500.r, stone500.g, stone500.b);
  doc.text(`Fecha: ${formatDate(pedido.creadoEn)}`, margin, y);
  y += 5;
  doc.text(`Estado: ${ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}`, margin, y);
  y += 5;
  doc.text(`Sede: ${pedido.sedeNombre || "—"}`, margin, y);
  y += 10;

  // ── Section: Pago ──
  doc.setFillColor(stone100.r, stone100.g, stone100.b);
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 28, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text("Información del Pago", margin + 4, y + 2);
  doc.setDrawColor(mustard.r, mustard.g, mustard.b);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, y + 5, pageWidth - margin - 4, y + 5);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(stone500.r, stone500.g, stone500.b);
  doc.text(`Referencia Wompi:`, margin + 4, y);
  doc.setTextColor(stone700.r, stone700.g, stone700.b);
  doc.text(`${pedido.referenciaPago || "—"}`, margin + 55, y);
  y += 5;
  doc.setTextColor(stone500.r, stone500.g, stone500.b);
  doc.text(`Método de Pago:`, margin + 4, y);
  doc.setTextColor(stone700.r, stone700.g, stone700.b);
  doc.text(`${pedido.metodoPago || "—"}`, margin + 55, y);
  y += 5;
  doc.setTextColor(stone500.r, stone500.g, stone500.b);
  doc.text(`Total:`, margin + 4, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text(`${formatCurrency(pedido.total)}`, margin + 55, y);
  y += 14;

  // ── Section: Entrega ──
  doc.setFillColor(stone100.r, stone100.g, stone100.b);
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 38, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text("Información de Entrega", margin + 4, y + 2);
  doc.setDrawColor(mustard.r, mustard.g, mustard.b);
  doc.line(margin + 4, y + 5, pageWidth - margin - 4, y + 5);
  y += 10;
  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text("Productos", margin, y);
  y += 6;

  const colProducto = margin;
  const colCant = 115;
  const colPrecio = 140;
  const colSubtotal = 165;

  // Table header with mustard background
  doc.setFillColor(mustard.r, mustard.g, mustard.b);
  doc.rect(margin, y - 4, pageWidth - margin * 2, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(white.r, white.g, white.b);
  doc.text("Producto", colProducto + 2, y);
  doc.text("Cant", colCant, y);
  doc.text("Precio", colPrecio, y);
  doc.text("Subtotal", colSubtotal, y);
  y += 6;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  pedido.detalles?.forEach((d, idx) => {
    const subtotal = d.cantidad * d.precioUnitario;

    // Alternate row background
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
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(subtotal), colSubtotal, y);
    doc.setFont("helvetica", "normal");
    y += nombreLinea.length * 4;

    if (d.notaPersonalizacion) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(stone400.r, stone400.g, stone400.b);
      const notaLinea = doc.splitTextToSize(`Nota: ${d.notaPersonalizacion}`, 80);
      doc.text(notaLinea, colProducto + 2, y);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      y += notaLinea.length * 3.5;
    }
    y += 2;
  });

  // Bottom line
  y += 2;
  doc.setDrawColor(mustard.r, mustard.g, mustard.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Total
  doc.setFillColor(mustard.r, mustard.g, mustard.b);
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
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
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(stone400.r, stone400.g, stone400.b);
  doc.text("Gracias por tu compra", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(mustardDark.r, mustardDark.g, mustardDark.b);
  doc.text("TAO Boutique Floral", pageWidth / 2, y, { align: "center" });

  doc.save(`pedido-${pedido.id}.pdf`);
}

const perfilSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  telefono: z.string().min(7, "Ingresa un teléfono válido"),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

const passwordSchema = z.object({
  passwordActual: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nuevaPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function MiCuentaPage() {
  const router = useRouter();
  const { isAuthenticated, rol, isHydrated } = useAuthStore();
  const isAuthClient = isHydrated && isAuthenticated && rol === "CLIENTE";

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthClient) {
      router.replace("/tienda/auth?redirect=/tienda/mi-cuenta");
    }
  }, [isHydrated, isAuthClient, router]);

  if (!isHydrated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10 flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthClient) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Mi Cuenta</h1>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">
            <Package className="size-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="direcciones">
            <MapPinIcon className="size-4" />
            Direcciones
          </TabsTrigger>
          <TabsTrigger value="perfil">
            <UserIcon className="size-4" />
            Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <PedidosTab />
        </TabsContent>

        <TabsContent value="direcciones">
          <DireccionesTab />
        </TabsContent>

        <TabsContent value="perfil">
          <PerfilTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Pedidos ───────────────────────────────────────────────────

function PedidosTab() {
  const { data, error, isLoading } = useSWR<PedidoHistorial[]>(
    API_PEDIDOS_URL,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoHistorial | null>(null);
  const [reviewModal, setReviewModal] = useState<{ productoId: number; productoNombre: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">
          Error al cargar los pedidos. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto mb-4 size-12 text-muted-foreground/60" />
        <h2 className="text-xl font-semibold mb-2">
          Aún no has realizado ninguna compra.
        </h2>
        <p className="text-muted-foreground">
          Explora nuestros productos y haz tu primer pedido.
        </p>
      </div>
    );
  }

  const pedidosOrdenados = [...data].sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""));

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidosOrdenados.map((pedido) => (
          <Card
            key={pedido.id}
            className={`flex flex-col border-l-4 ${STATUS_BORDER_COLORS[pedido.estado] ?? "border-l-stone-400"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm truncate">#{pedido.id}</span>
                <Badge
                  className={`${ORDER_STATUS_COLORS[pedido.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-700 border-stone-200"} text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 shrink-0`}
                >
                  <span className={`size-2 rounded-full ${STATUS_DOT_COLORS[pedido.estado] ?? "bg-stone-400"}`} />
                  {ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span>{formatDate(pedido.creadoEn)}</span>
                <span>·</span>
                <span>{pedido.sedeNombre}</span>
              </div>

              <div className="border-t pt-2 mt-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Productos
                </p>
                <div className="max-h-[108px] overflow-y-auto space-y-1.5">
                  {pedido.detalles?.map((d, i) => (
                    <div key={i}>
                      <p className="text-xs flex items-baseline gap-1">
                        <span className="font-medium shrink-0">{d.cantidad}x</span>
                        <span className="truncate">{d.productoNombre}</span>
                        {pedido.estado === "ENTREGADO" && d.productoId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[10px] text-brand-mustard hover:text-brand-mustard/80 shrink-0"
                            onClick={() => setReviewModal({ productoId: d.productoId, productoNombre: d.productoNombre })}
                          >
                            <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                            Reseña
                          </Button>
                        )}
                      </p>
                      {d.notaPersonalizacion && (
                        <div className="flex items-baseline gap-1 ml-4 mt-0.5">
                          <StickyNote className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                          <p className="text-[11px] text-muted-foreground italic leading-tight">
                            {d.notaPersonalizacion}
                          </p>
                        </div>
                      )}
                    </div>
                  )) ?? <p className="text-xs text-muted-foreground">Sin productos</p>}
                </div>
              </div>

              <div className="flex justify-between font-bold text-sm pt-2 border-t mt-2">
                <span>Total</span>
                <span>{formatCurrency(pedido.total)}</span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPedidoSeleccionado(pedido)}
                className="gap-1.5"
              >
                <Eye className="size-4" />
                Ver Detalles
              </Button>
              <Button
                size="sm"
                onClick={() => generarPDF(pedido)}
                className="gap-1.5"
              >
                <Download className="size-4" />
                Descargar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <PedidoDetalleDialog
        pedido={pedidoSeleccionado}
        onOpenChange={(open) => {
          if (!open) setPedidoSeleccionado(null);
        }}
      />

      <ReseñasModal
        open={reviewModal !== null}
        onOpenChange={(open) => {
          if (!open) setReviewModal(null);
        }}
        productoId={reviewModal?.productoId ?? 0}
        productoNombre={reviewModal?.productoNombre ?? ""}
      />
    </div>
  );
}

// ─── Dialog de Detalles del Pedido ──────────────────────────────

interface PedidoDetalleDialogProps {
  pedido: PedidoHistorial | null;
  onOpenChange: (open: boolean) => void;
}

function PedidoDetalleDialog({ pedido, onOpenChange }: PedidoDetalleDialogProps) {
  return (
    <Dialog open={pedido !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-stone-200 p-0 overflow-hidden">
        {/* Header branded */}
        <div className="bg-gradient-to-r from-[var(--color-brand-mustard)]/10 via-[var(--color-brand-rose)]/5 to-transparent px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-stone-800 text-lg">
                Pedido #{pedido?.id}
              </DialogTitle>
              <DialogDescription className="text-stone-500 mt-0.5">
                {pedido?.sedeNombre} &middot; {formatDate(pedido?.creadoEn ?? "")}
              </DialogDescription>
              <Badge
                className={`mt-2 text-xs ${ORDER_STATUS_COLORS[pedido?.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-700"}`}
              >
                {ORDER_STATUS_LABELS[pedido?.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido?.estado}
              </Badge>
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
                <span className="text-stone-400">Referencia Wompi</span>
                <span className="font-mono text-xs text-stone-600">
                  {pedido?.referenciaPago || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Método de Pago</span>
                <span className="font-medium capitalize text-stone-700">
                  {pedido?.metodoPago || "—"}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-stone-500 font-medium">Total</span>
                <span className="font-bold text-[var(--color-brand-mustard-dark)]">
                  {formatCurrency(pedido?.total ?? 0)}
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
                <span className="text-stone-400">Sede</span>
                <span className="font-medium text-stone-700">
                  {pedido?.sedeNombre || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Alias</span>
                <span className="text-stone-600">{pedido?.direccionEntrega?.alias || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Dirección</span>
                <span className="text-right max-w-[60%] text-stone-600">
                  {pedido?.direccionEntrega?.direccion || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Ciudad</span>
                <span className="text-stone-600">{pedido?.direccionEntrega?.ciudad || "—"}</span>
              </div>
              {pedido?.direccionEntrega?.detalles && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Detalles</span>
                  <span className="text-right max-w-[60%] text-stone-600">
                    {pedido.direccionEntrega.detalles}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-stone-400">Zona de Envío</span>
                <span className="font-medium text-stone-700">
                  {pedido?.zonaDomicilioNombre || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Costo de Envío</span>
                <span className="font-medium text-stone-700">
                  {formatCurrency(pedido?.costoEnvio ?? 0)}
                </span>
              </div>
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
                  {pedido?.detalles?.map((d, i) => (
                    <TableRow key={i} className={`border-stone-100 ${i % 2 === 0 ? "bg-white/50" : "bg-stone-50/30"}`}>
                      <TableCell className="text-sm font-medium text-stone-700 py-2">
                        {d.productoNombre}
                        <span className="block text-xs text-stone-400 font-normal">
                          {d.productoSku}
                        </span>
                        {d.notaPersonalizacion && (
                          <span className="flex items-center gap-1 text-xs text-[var(--color-brand-rose)] italic font-normal mt-0.5">
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
            onClick={() => onOpenChange(false)}
            className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => pedido && generarPDF(pedido)}
            className="gap-1.5 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
          >
            <Download className="size-4" />
            Descargar Comprobante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Perfil ────────────────────────────────────────────────────

function PerfilTab() {
  const { nombre, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const { data: perfil, mutate } = useSWR<ClientePerfilResponse>(
    "perfil-cliente",
    obtenerPerfil,
    { revalidateOnFocus: false }
  );

  const form = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    values: {
      nombre: perfil?.nombre ?? nombre ?? "",
      telefono: perfil?.telefono ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      passwordActual: "",
      nuevaPassword: "",
    },
  });

  const handleSubmit = async (data: PerfilFormData) => {
    setIsLoading(true);
    try {
      const res = await actualizarPerfil(data);
      updateProfile(res.nombre, res.telefono);
      mutate();
      toast.success("Perfil actualizado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar el perfil."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoadingPassword(true);
    try {
      await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/perfil/password`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      toast.success("Contraseña cambiada correctamente.");
      passwordForm.reset();
    } catch (error) {
      let mensaje = "Error al cambiar la contraseña.";
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          mensaje = parsed.message || mensaje;
        } catch {
          mensaje = error.message || mensaje;
        }
      }
      toast.error(mensaje);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="perfil-nombre">Nombre</Label>
              <Input
                id="perfil-nombre"
                type="text"
                placeholder="Tu nombre"
                {...form.register("nombre")}
                disabled={isLoading}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil-telefono">Teléfono</Label>
              <Input
                id="perfil-telefono"
                type="tel"
                placeholder="+57 300 000 0000"
                {...form.register("telefono")}
                disabled={isLoading}
              />
              {form.formState.errors.telefono && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.telefono.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password-actual">Contraseña actual</Label>
              <Input
                id="password-actual"
                type="password"
                placeholder="Tu contraseña actual"
                {...passwordForm.register("passwordActual")}
                disabled={isLoadingPassword}
              />
              {passwordForm.formState.errors.passwordActual && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.passwordActual.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nueva-password">Nueva contraseña</Label>
              <Input
                id="nueva-password"
                type="password"
                placeholder="Tu nueva contraseña"
                {...passwordForm.register("nuevaPassword")}
                disabled={isLoadingPassword}
              />
              {passwordForm.formState.errors.nuevaPassword && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.nuevaPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoadingPassword}>
              {isLoadingPassword ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Direcciones ───────────────────────────────────────────────

function DireccionesTab() {
  const { data, error, isLoading, mutate } = useSWR<DireccionResponse[]>(
    API_DIRECCIONES_URL,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<DireccionResponse | null>(null);
  const [direccionToDelete, setDireccionToDelete] = useState<DireccionResponse | null>(null);

  const handleDelete = (dir: DireccionResponse) => {
    setDireccionToDelete(dir);
  };

  const confirmDelete = async () => {
    if (!direccionToDelete) return;
    const id = direccionToDelete.id;
    setDireccionToDelete(null);

    try {
      await eliminarDireccion(id);
      toast.success("Dirección eliminada.");
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la dirección."
      );
    }
  };

  const handleEdit = (dir: DireccionResponse) => {
    setEditingDireccion(dir);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingDireccion(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditingDireccion(null);
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando direcciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">
          Error al cargar las direcciones. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <PlusIcon className="size-4" />
          Agregar nueva dirección
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <div className="py-12 text-center">
          <MapPinIcon className="mx-auto mb-4 size-12 text-muted-foreground/60" />
          <p className="text-muted-foreground">
            No tienes direcciones guardadas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((dir) => (
            <Card key={dir.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{dir.alias}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(dir)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(dir)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>
                  {dir.direccion}, {dir.ciudad}
                </p>
                {dir.detalles && (
                  <p className="text-xs text-muted-foreground/70">
                    {dir.detalles}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DireccionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingDireccion(null);
          }
        }}
        direccion={editingDireccion}
        onSaved={handleSaved}
      />

      <Dialog open={direccionToDelete !== null} onOpenChange={(open) => { if (!open) setDireccionToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar dirección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la dirección &ldquo;{direccionToDelete?.alias}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDireccionToDelete(null)}>
              No, volver
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Dialog de Dirección (Crear / Editar) ──────────────────────

interface DireccionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direccion: DireccionResponse | null;
  onSaved: () => void;
}

function DireccionDialog({
  open,
  onOpenChange,
  direccion,
  onSaved,
}: DireccionDialogProps) {
  const isEditing = direccion !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sedes } = useSWR<Sede[]>(API_SEDES_URL, fetcher, {
    revalidateOnFocus: false,
  });
  const sedesOptions = sedes?.map((s) => ({
    id: s.id,
    label: `${s.nombre} - ${s.ciudad}`,
    ciudad: s.ciudad,
  })) ?? [];

  const [form, setForm] = useState<DireccionRequest>({
    alias: "",
    direccion: "",
    ciudad: "",
    detalles: "",
    zonaDomicilioId: 0,
  });

  // ── Zona de Domicilio (Selects Dependientes) ───────────────
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);

  const { data: zonas, isLoading: loadingZonas } = useSWR<ZonaDomicilioResponse[]>(
    selectedSedeId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${selectedSedeId}`
      : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  const [selectedLocalidad, setSelectedLocalidad] = useState<string>("");
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);

  const localidades = useMemo(() => {
    if (!zonas) return [];
    return [...new Set(zonas.map((z) => z.localidad))].sort();
  }, [zonas]);

  const barrios = useMemo(() => {
    if (!zonas || !selectedLocalidad) return [];
    const filtradas = zonas.filter((z) => z.localidad === selectedLocalidad);
    return filtradas.map((z) => ({
      id: z.id,
      label: z.barrio || "Otro",
      hasBarrio: !!z.barrio,
    }));
  }, [zonas, selectedLocalidad]);

  const handleLocalidadChange = (value: string | null) => {
    if (!value || value === "__none") return;
    setSelectedLocalidad(value);
    setSelectedBarrio("");
    setSelectedZonaId(null);
    setForm((prev) => ({ ...prev, zonaDomicilioId: 0 }));
  };

  const handleBarrioChange = (value: string | null) => {
    if (!value || value === "__none") return;
    setSelectedBarrio(value);
    const zona = barrios.find((b) => b.label === value);
    const zonaId = zona?.id ?? 0;
    setSelectedZonaId(zonaId);
    setForm((prev) => ({ ...prev, zonaDomicilioId: zonaId }));
  };

  const handleSedeChange = (sedeId: string | null) => {
    if (!sedeId || sedeId === "__none") return;
    const sede = sedesOptions.find((s) => s.id === Number(sedeId));
    if (!sede) return;

    setSelectedSedeId(sede.id);
    setForm((prev) => ({
      ...prev,
      ciudad: sede.ciudad,
      zonaDomicilioId: 0,
    }));
    setSelectedLocalidad("");
    setSelectedBarrio("");
    setSelectedZonaId(null);
  };

  useEffect(() => {
    if (open) {
      if (direccion) {
        setForm({
          alias: direccion.alias,
          direccion: direccion.direccion,
          ciudad: direccion.ciudad,
          detalles: direccion.detalles ?? "",
          zonaDomicilioId: direccion.zonaDomicilioId ?? 0,
        });
        setSelectedZonaId(direccion.zonaDomicilioId ?? null);
        const sedeEncontrada = sedes?.find((s) => s.ciudad === direccion.ciudad);
        setSelectedSedeId(sedeEncontrada?.id ?? null);
      } else {
        setForm({ alias: "", direccion: "", ciudad: "", detalles: "", zonaDomicilioId: 0 });
        setSelectedLocalidad("");
        setSelectedBarrio("");
        setSelectedZonaId(null);
        setSelectedSedeId(null);
      }
    }
  }, [open, direccion, sedes]);

  // Pre-seleccionar localidad y barrio al editar
  useEffect(() => {
    if (open && isEditing && zonas && direccion?.zonaDomicilioId) {
      const zona = zonas.find((z) => z.id === direccion.zonaDomicilioId);
      if (zona) {
        setSelectedLocalidad(zona.localidad);
        setSelectedBarrio(zona.barrio || "Otro");
      }
    }
  }, [open, isEditing, zonas, direccion]);

  const handleChange = (field: keyof DireccionRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Si cambia la ciudad, resetear zona
    if (field === "ciudad") {
      setSelectedLocalidad("");
      setSelectedBarrio("");
      setSelectedZonaId(null);
      setForm((prev) => ({ ...prev, [field]: value, zonaDomicilioId: 0 }));
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.alias.trim() || !form.direccion.trim() || !form.ciudad.trim()) {
      toast.error("Completa los campos obligatorios: alias, dirección y ciudad.");
      return;
    }

    if (!form.zonaDomicilioId && zonas && zonas.length > 0) {
      toast.error("Selecciona una zona de domicilio (localidad y barrio).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await actualizarDireccion(direccion.id, form);
        toast.success("Dirección actualizada.");
      } else {
        await crearDireccion(form);
        toast.success("Dirección guardada.");
      }
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la dirección."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar dirección" : "Nueva dirección"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos de tu dirección."
              : "Agrega una nueva dirección de entrega."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-alias">Alias *</Label>
            <Input
              id="dialog-alias"
              placeholder="Ej: Casa, Oficina"
              value={form.alias}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-direccion">Dirección *</Label>
            <Input
              id="dialog-direccion"
              placeholder="Calle 10 # 20-30, Apto 501"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-ciudad">Sede de Despacho *</Label>
            <Select
              value={selectedSedeId?.toString() ?? ""}
              onValueChange={handleSedeChange}
              disabled={isSubmitting || !sedes}
            >
              <SelectTrigger id="dialog-ciudad">
                {selectedSedeId && sedes
                  ? (() => {
                      const sede = sedes.find((s) => s.id === selectedSedeId);
                      return sede ? `${sede.nombre} - ${sede.ciudad}` : null;
                    })()
                  : (
                    <SelectValue placeholder={
                      !sedes ? "Cargando sedes..." : "Selecciona una sede"
                    } />
                  )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Selecciona una sede...</SelectItem>
                {sedesOptions.map((sede) => (
                  <SelectItem key={sede.id} value={sede.id.toString()}>
                    {sede.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Zona de Domicilio (Selects Dependientes) ─────── */}
          {loadingZonas && selectedSedeId && (
            <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
              <LoaderIcon className="size-4 animate-spin" />
              Cargando zonas de domicilio...
            </div>
          )}

          {!loadingZonas && zonas && zonas.length === 0 && selectedSedeId && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
              <MapPinIcon className="size-4 shrink-0" />
              No hay zonas de domicilio configuradas para esta sede. Contacta al administrador.
            </div>
          )}

          {!loadingZonas && zonas && zonas.length > 0 && form.ciudad && (
            <>
              <div className="space-y-2">
                <Label>Localidad / Municipio *</Label>
                <Select
                  value={selectedLocalidad}
                  onValueChange={handleLocalidadChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Selecciona una localidad...</SelectItem>
                    {localidades.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLocalidad && (
                <div className="space-y-2">
                  <Label>Barrio</Label>
                  <Select
                    value={selectedBarrio}
                    onValueChange={handleBarrioChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un barrio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Selecciona un barrio...</SelectItem>
                      {barrios.map((b) => (
                        <SelectItem key={b.id} value={b.label}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="dialog-detalles">Detalles adicionales</Label>
            <Input
              id="dialog-detalles"
              placeholder="Casa azul, portería, etc."
              value={form.detalles}
              onChange={(e) => handleChange("detalles", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Guardar dirección"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
