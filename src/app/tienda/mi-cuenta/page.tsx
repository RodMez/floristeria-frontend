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
  EyeOff,
  Lock,
  Download,
  CreditCard,
  Truck,
  StickyNote,
  MessageSquare,
  ShoppingBag,
  LogOut,
  CheckCircle,
  AlertTriangle,
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
import { loadCinzelFonts } from "@/lib/pdfFonts";
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

  // Load Cinzel fonts
  const FONT = (await loadCinzelFonts(doc)) ? "Cinzel" : "Times-Roman";

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

  // Mustard separator line
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
  doc.text(`Sede: ${pedido.sedeNombre || "—"}`, margin, y);
  y += 10;

  // ── Section: Pago ──
  doc.setFillColor(stone100.r, stone100.g, stone100.b);
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 28, 2, 2, "F");
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

  // Table header with mustard background
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

  // Table rows
  doc.setFont(FONT, "normal");
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

  // Bottom line
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
}

const perfilSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  telefono: z.string().min(7, "Ingresa un teléfono válido"),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

const passwordSchema = z.object({
  passwordActual: z.string().min(1, "Ingresa tu contraseña actual"),
  nuevaPassword: z.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .refine((v) => /[A-Z]/.test(v) || /[0-9]/.test(v), "Incluye al menos una mayúscula o número"),
  confirmarPassword: z.string().min(1, "Confirma tu nueva contraseña"),
}).refine((data) => data.nuevaPassword === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function MiCuentaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pedidos");
  const { isAuthenticated, rol, isHydrated, logout, nombre, email } = useAuthStore();
  const isAuthClient = isHydrated && isAuthenticated && rol === "CLIENTE";

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthClient) {
      router.replace("/tienda/auth?redirect=/tienda/mi-cuenta");
    }
  }, [isHydrated, isAuthClient, router]);

  const userInitial = (nombre || "U").charAt(0).toUpperCase();

  const navItems = [
    { id: "pedidos", label: "Pedidos", icon: Package },
    { id: "direcciones", label: "Direcciones", icon: MapPinIcon },
    { id: "perfil", label: "Perfil", icon: UserIcon },
  ];

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
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      {/* ── Layout: Sidebar + Content ─────────── */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="flex gap-6">

          {/* ═══ Sidebar (desktop) ═══ */}
          <aside className="hidden md:block w-[260px] shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">

                <div className="p-5 pb-4 bg-gradient-to-r from-[var(--color-brand-rose-light)] to-[var(--color-brand-rose)]/30">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-[var(--color-brand-mustard)] flex items-center justify-center shrink-0 shadow-sm">
                      <span className="font-heading text-lg font-bold text-stone-900">{userInitial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-[var(--color-brand-mustard-dark)] text-sm truncate">{nombre}</p>
                      <p className="text-xs text-stone-600 truncate mt-0.5">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-100" />

                <nav className="p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          activeTab === item.id
                            ? "bg-[var(--color-brand-mustard)]/15 text-[var(--color-brand-mustard-dark)] font-semibold"
                            : "text-stone-500 hover:bg-[var(--color-brand-rose-light)]/40 hover:text-stone-700"
                        }`}
                      >
                        <Icon className={`size-5 ${activeTab === item.id ? "text-[var(--color-brand-mustard-dark)]" : "text-stone-400"}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="border-t border-stone-100" />

                <div className="p-2">
                  <button
                    onClick={() => { logout(); router.push("/tienda"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="size-5" />
                    Cerrar sesión
                  </button>
                </div>

              </div>
            </div>
          </aside>

          {/* ═══ Content ═══ */}
          <main className="flex-1 min-w-0">

            <div className="flex md:hidden overflow-x-auto gap-2 pb-2 mb-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                      activeTab === item.id
                        ? "bg-[var(--color-brand-mustard)] text-stone-900 font-bold shadow-sm"
                        : "bg-[var(--color-brand-rose-light)] text-stone-600 hover:bg-[var(--color-brand-rose)]/30"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
              {activeTab === "pedidos" && <PedidosTab />}
              {activeTab === "direcciones" && <DireccionesTab />}
              {activeTab === "perfil" && <PerfilTab />}
            </div>

          </main>

        </div>
      </div>
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
          <Package className="h-12 w-12 mx-auto mb-4 text-[var(--color-brand-rose)] animate-pulse" />
          <p className="text-stone-500">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">
          Error al cargar los pedidos. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto mb-4 size-12 text-[var(--color-brand-rose)]" />
        <h2 className="font-heading text-xl font-bold text-[var(--color-brand-mustard-dark)] mb-2">
          Aún no has realizado ninguna compra.
        </h2>
        <p className="text-stone-500 mb-6">
          Explora nuestros productos y haz tu primer pedido.
        </p>
        <Button
          onClick={() => window.location.href = "/tienda"}
          className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
        >
          <ShoppingBag className="size-4 mr-1.5" />
          Explorar productos
        </Button>
      </div>
    );
  }

  const pedidosOrdenados = [...data].sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""));

  return (
    <div className="space-y-4">
      {pedidosOrdenados.map((pedido) => (
        <div
          key={pedido.id}
          className={`rounded-lg bg-white border border-stone-200 border-l-4 ${STATUS_BORDER_COLORS[pedido.estado] ?? "border-l-stone-400"} hover:shadow-md transition-shadow p-4`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="font-mono text-sm font-bold text-stone-800">#{pedido.id}</span>
              <div className="text-xs text-stone-500 mt-1 space-y-0.5">
                <p>{formatDate(pedido.creadoEn)}</p>
                <p className="text-stone-400">{pedido.sedeNombre}</p>
              </div>
            </div>
            <Badge
              className={`${ORDER_STATUS_COLORS[pedido.estado as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-700 border-stone-200"} text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 shrink-0`}
            >
              <span className={`size-2 rounded-full ${STATUS_DOT_COLORS[pedido.estado] ?? "bg-stone-400"}`} />
              {ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}
            </Badge>
          </div>

          <div className="border-t border-stone-100 my-3" />

          <div className="space-y-1.5">
            {pedido.detalles?.map((d, i) => (
              <div key={i}>
                <p className="text-sm flex items-baseline gap-1">
                  <span className="font-medium shrink-0 text-stone-700">{d.cantidad}x</span>
                  <span className="truncate text-stone-600">{d.productoNombre}</span>
                  {pedido.estado === "ENTREGADO" && d.productoId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-[var(--color-brand-mustard-dark)] hover:text-[var(--color-brand-mustard)] shrink-0"
                      onClick={() => setReviewModal({ productoId: d.productoId, productoNombre: d.productoNombre })}
                    >
                      <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                      Reseña
                    </Button>
                  )}
                </p>
                {d.notaPersonalizacion && (
                  <div className="flex items-baseline gap-1 ml-4 mt-0.5">
                    <StickyNote className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                    <p className="text-[11px] text-stone-400 italic leading-tight">
                      {d.notaPersonalizacion}
                    </p>
                  </div>
                )}
              </div>
            )) ?? <p className="text-xs text-stone-400">Sin productos</p>}
          </div>

          <div className="border-t border-stone-100 my-3" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-stone-500 font-medium">Total</span>
              <span className="text-lg font-bold text-[var(--color-brand-mustard-dark)]">{formatCurrency(pedido.total)}</span>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPedidoSeleccionado(pedido)}
                className="gap-1.5 border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
              >
                <Eye className="size-4" />
                Ver Detalles
              </Button>
              <Button
                size="sm"
                onClick={() => generarPDF(pedido)}
                className="gap-1.5 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
              >
                <Download className="size-4" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      ))}

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
          <div className="rounded-lg border border-[var(--color-brand-rose-light)] bg-[var(--color-brand-rose-light)]/20 p-3.5">
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
              <div className="flex justify-between border-t border-[var(--color-brand-rose-light)] pt-2">
                <span className="text-stone-500 font-medium">Total</span>
                <span className="font-bold text-[var(--color-brand-mustard-dark)]">
                  {formatCurrency(pedido?.total ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección 2: Información de Entrega */}
          <div className="rounded-lg border border-[var(--color-brand-rose-light)] bg-[var(--color-brand-rose-light)]/20 p-3.5">
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
              <div className="flex justify-between border-t border-[var(--color-brand-rose-light)] pt-2">
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
          <div className="rounded-lg border border-[var(--color-brand-rose-light)] bg-[var(--color-brand-rose-light)]/20 p-3.5">
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

        <DialogFooter className="px-6 pb-5 border-t border-[var(--color-brand-rose-light)] pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => pedido && generarPDF(pedido)}
            className="gap-1.5 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
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
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

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
      confirmarPassword: "",
    },
  });

  const nuevaPasswordValue = passwordForm.watch("nuevaPassword") ?? "";
  const confirmarPasswordValue = passwordForm.watch("confirmarPassword") ?? "";
  const passwordsMatch = nuevaPasswordValue.length > 0 && nuevaPasswordValue === confirmarPasswordValue;

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Débil", color: "bg-red-400", width: "w-1/5", textColor: "text-red-500" };
    if (score <= 3) return { label: "Media", color: "bg-amber-400", width: "w-3/5", textColor: "text-amber-600" };
    return { label: "Fuerte", color: "bg-emerald-400", width: "w-full", textColor: "text-emerald-600" };
  };

  const strength = getPasswordStrength(nuevaPasswordValue);

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
          body: JSON.stringify({
            passwordActual: data.passwordActual,
            nuevaPassword: data.nuevaPassword,
          }),
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

  const initial = (perfil?.nombre ?? nombre ?? "?").charAt(0).toUpperCase();
  const email = perfil?.email ?? "";

  return (
    <div className="space-y-6">
      {/* ─── Header perfil ─────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-[var(--color-brand-rose-light)] to-[var(--color-brand-rose)]/30 p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-[var(--color-brand-mustard)] flex items-center justify-center shrink-0 shadow-md">
          <span className="font-heading text-2xl text-stone-900 font-bold select-none">{initial}</span>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-[var(--color-brand-mustard-dark)]">
            {perfil?.nombre ?? nombre}
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">{email}</p>
        </div>
      </div>

      {/* ─── Información Personal ──────────────────────────────────── */}
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
            </div>
            <div>
              <CardTitle className="font-heading text-lg">Información Personal</CardTitle>
              <p className="text-sm text-stone-500 mt-0.5">Actualiza tus datos personales</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perfil-nombre" className="text-stone-700 font-medium text-sm">Nombre</Label>
                <Input
                  id="perfil-nombre"
                  type="text"
                  placeholder="Tu nombre"
                  className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-11"
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
                <Label htmlFor="perfil-telefono" className="text-stone-700 font-medium text-sm">Teléfono</Label>
                <Input
                  id="perfil-telefono"
                  type="tel"
                  placeholder="+57 300 000 0000"
                  className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-11"
                  {...form.register("telefono")}
                  disabled={isLoading}
                />
                {form.formState.errors.telefono && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.telefono.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold h-11 px-8"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Seguridad ────────────────────────────────────────────── */}
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--color-brand-rose)] flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="font-heading text-lg">Seguridad</CardTitle>
              <p className="text-sm text-stone-500 mt-0.5">Cambia tu contraseña para mantener tu cuenta segura</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="space-y-4"
          >
            {/* Contraseña actual */}
            <div className="space-y-2">
              <Label htmlFor="password-actual" className="text-stone-700 font-medium text-sm">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="password-actual"
                  type={showActual ? "text" : "password"}
                  placeholder="Tu contraseña actual"
                  className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-11 pr-10"
                  {...passwordForm.register("passwordActual")}
                  disabled={isLoadingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowActual(!showActual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showActual ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {passwordForm.formState.errors.passwordActual && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.passwordActual.message}
                </p>
              )}
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-2">
              <Label htmlFor="nueva-password" className="text-stone-700 font-medium text-sm">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="nueva-password"
                  type={showNueva ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-11 pr-10"
                  {...passwordForm.register("nuevaPassword")}
                  disabled={isLoadingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNueva(!showNueva)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNueva ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {passwordForm.formState.errors.nuevaPassword && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.nuevaPassword.message}
                </p>
              )}
              {/* Strength indicator */}
              {nuevaPasswordValue.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs font-medium ${strength.textColor}`}>
                    Fortaleza: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmar-password" className="text-stone-700 font-medium text-sm">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmar-password"
                  type={showConfirmar ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-11 pr-10"
                  {...passwordForm.register("confirmarPassword")}
                  disabled={isLoadingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {/* Match indicator */}
              {confirmarPasswordValue.length > 0 && (
                passwordsMatch ? (
                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Las contraseñas coinciden
                  </p>
                ) : (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Las contraseñas no coinciden
                  </p>
                )
              )}
              {passwordForm.formState.errors.confirmarPassword && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.confirmarPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isLoadingPassword}
                className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold h-11 px-8"
              >
                {isLoadingPassword ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </div>
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
          <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-brand-rose)] animate-pulse" />
          <p className="text-stone-500">Cargando direcciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">
          Error al cargar las direcciones. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Button
          size="sm"
          onClick={handleAdd}
          className="bg-[var(--color-brand-mustard-dark)] text-stone-900 hover:bg-[var(--color-brand-mustard)] font-bold gap-1.5"
        >
          <PlusIcon className="size-4" />
          Agregar nueva dirección
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <div className="py-12 text-center">
          <MapPinIcon className="mx-auto mb-4 size-12 text-[var(--color-brand-rose)]" />
          <h3 className="font-heading text-lg font-bold text-stone-800 mb-1">No tienes direcciones guardadas</h3>
          <p className="text-stone-500 mb-4">
            Agrega una dirección para que podamos entregarte tus pedidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((dir) => (
            <Card key={dir.id} className="border-stone-200 hover:shadow-md transition-shadow hover:border-[var(--color-brand-mustard)]/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--color-brand-rose-light)] flex items-center justify-center shrink-0">
                      <MapPinIcon className="h-4 w-4 text-[var(--color-brand-rose-dark)]" />
                    </div>
                    <CardTitle className="font-heading text-base text-[var(--color-brand-mustard-dark)]">{dir.alias}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(dir)}
                      className="text-stone-400 hover:text-[var(--color-brand-mustard-dark)]"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(dir)}
                      className="text-stone-400 hover:text-red-500"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-stone-600 space-y-1 pt-0">
                <p>
                  {dir.direccion}, {dir.ciudad}
                </p>
                {dir.zonaDomicilioNombre && (
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <Truck className="size-3 shrink-0" />
                    {dir.zonaDomicilioNombre}
                  </p>
                )}
                {dir.detalles && (
                  <p className="text-xs text-stone-400">
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
        <DialogContent className="border-[var(--color-brand-rose)]">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Eliminar dirección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la dirección &ldquo;{direccionToDelete?.alias}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDireccionToDelete(null)}
              className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
            >
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

  const API_ZONAS_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio`;

  const { data: allZones, isLoading: loadingZonas } = useSWR<ZonaDomicilioResponse[]>(
    sedes ? `zonas-todas` : null,
    async () => {
      if (!sedes) return [];
      const results = await Promise.all(
        sedes.map((s) =>
          fetch(`${API_ZONAS_BASE}/sede/${s.id}`).then((r) => {
            if (!r.ok) throw new Error("Error al cargar zonas");
            return r.json();
          })
        )
      );
      return results.flat();
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const zonasBySede = useMemo(() => {
    if (!allZones || !selectedSedeId) return [];
    return allZones.filter((z) => z.sedeId === selectedSedeId);
  }, [allZones, selectedSedeId]);

  const [selectedLocalidad, setSelectedLocalidad] = useState<string>("");
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);

  const localidades = useMemo(() => {
    if (!zonasBySede.length) return [];
    return [...new Set(zonasBySede.map((z) => z.localidad))].sort();
  }, [zonasBySede]);

  const barrios = useMemo(() => {
    if (!zonasBySede.length || !selectedLocalidad) return [];
    const filtradas = zonasBySede.filter((z) => z.localidad === selectedLocalidad);
    return filtradas.map((z) => ({
      id: z.id,
      label: z.barrio || "Otro",
      hasBarrio: !!z.barrio,
    }));
  }, [zonasBySede, selectedLocalidad]);

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
    if (!open) return;
    if (direccion) {
      setForm({
        alias: direccion.alias,
        direccion: direccion.direccion,
        ciudad: direccion.ciudad,
        detalles: direccion.detalles ?? "",
        zonaDomicilioId: direccion.zonaDomicilioId ?? 0,
      });
      setSelectedZonaId(direccion.zonaDomicilioId ?? null);
    } else {
      setForm({ alias: "", direccion: "", ciudad: "", detalles: "", zonaDomicilioId: 0 });
      setSelectedLocalidad("");
      setSelectedBarrio("");
      setSelectedZonaId(null);
      setSelectedSedeId(null);
    }
  }, [open, direccion]);

  useEffect(() => {
    if (!open || !direccion || !allZones) return;
    const zonaEncontrada = allZones.find((z) => z.id === direccion.zonaDomicilioId);
    if (zonaEncontrada) {
      setSelectedSedeId(zonaEncontrada.sedeId);
      setSelectedLocalidad(zonaEncontrada.localidad);
      setSelectedBarrio(zonaEncontrada.barrio || "Otro");
    }
  }, [open, direccion, allZones]);

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

    if (!form.zonaDomicilioId && zonasBySede.length > 0) {
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
      <DialogContent className="sm:max-w-md border-[var(--color-brand-rose)]">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
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
            <Label htmlFor="dialog-alias" className="text-stone-700 font-medium">Alias *</Label>
            <Input
              id="dialog-alias"
              placeholder="Ej: Casa, Oficina"
              value={form.alias}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={isSubmitting}
              className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-direccion" className="text-stone-700 font-medium">Dirección *</Label>
            <Input
              id="dialog-direccion"
              placeholder="Calle 10 # 20-30, Apto 501"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              disabled={isSubmitting}
              className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-ciudad" className="text-stone-700 font-medium">Sede de Despacho *</Label>
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

          {!loadingZonas && allZones && zonasBySede.length === 0 && selectedSedeId && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
              <MapPinIcon className="size-4 shrink-0" />
              No hay zonas de domicilio configuradas para esta sede. Contacta al administrador.
            </div>
          )}

          {!loadingZonas && allZones && zonasBySede.length > 0 && selectedSedeId && (
            <>
              <div className="space-y-2">
                <Label className="text-stone-700 font-medium">Localidad / Municipio *</Label>
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
                  <Label className="text-stone-700 font-medium">Barrio</Label>
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
            <Label htmlFor="dialog-detalles" className="text-stone-700 font-medium">Detalles adicionales</Label>
            <Input
              id="dialog-detalles"
              placeholder="Casa azul, portería, etc."
              value={form.detalles}
              onChange={(e) => handleChange("detalles", e.target.value)}
              disabled={isSubmitting}
              className="border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 bg-white h-12"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
            >
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
