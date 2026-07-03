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

const API_PEDIDOS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`;
const API_DIRECCIONES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;
const API_SEDES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`;

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDIENTE_PAGO:
    "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
  PAGADO: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  EN_PREPARACION:
    "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  EN_CAMINO:
    "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
  ENTREGADO:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  CANCELADO: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
};

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
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidosOrdenados.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-mono text-sm">#{pedido.id}</TableCell>
                <TableCell className="text-sm">{formatDate(pedido.creadoEn)}</TableCell>
                <TableCell className="text-sm">{pedido.sedeNombre ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      STATUS_BADGE_STYLES[pedido.estado] ??
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {ORDER_STATUS_LABELS[pedido.estado as keyof typeof ORDER_STATUS_LABELS] ?? pedido.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(pedido.total)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPedidoSeleccionado(pedido)}
                    className="gap-1.5"
                  >
                    <Eye className="size-4" />
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PedidoDetalleDialog
        pedido={pedidoSeleccionado}
        onOpenChange={(open) => {
          if (!open) setPedidoSeleccionado(null);
        }}
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
  const generarPDF = () => {
    if (!pedido) return;

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

  return (
    <Dialog open={pedido !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedido #{pedido?.id}</DialogTitle>
          <DialogDescription>
            {pedido?.sedeNombre} — {formatDate(pedido?.creadoEn ?? "")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sección 1: Información del Pago */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <CreditCard className="size-3.5" />
              Información del Pago
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referencia Wompi</span>
                <span className="font-mono text-xs">
                  {pedido?.referenciaPago || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de Pago</span>
                <span className="font-medium capitalize">
                  {pedido?.metodoPago || "—"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1.5">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">
                  {formatCurrency(pedido?.total ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección 2: Información de Entrega */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Truck className="size-3.5" />
              Información de Entrega
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sede</span>
                <span className="font-medium">
                  {pedido?.sedeNombre || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alias</span>
                <span>{pedido?.direccionEntrega?.alias || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dirección</span>
                <span className="text-right max-w-[60%]">
                  {pedido?.direccionEntrega?.direccion || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciudad</span>
                <span>{pedido?.direccionEntrega?.ciudad || "—"}</span>
              </div>
              {pedido?.direccionEntrega?.detalles && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detalles</span>
                  <span className="text-right max-w-[60%]">
                    {pedido.direccionEntrega.detalles}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5 mt-1.5">
                <span className="text-muted-foreground">Zona de Envío</span>
                <span className="font-medium">
                  {pedido?.zonaDomicilioNombre || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo de Envío</span>
                <span className="font-medium">
                  {formatCurrency(pedido?.costoEnvio ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección 3: Productos */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Package className="size-3.5" />
              Productos
            </h4>
            <div className="bg-muted/50 rounded-lg max-h-[250px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs text-right">Cant</TableHead>
                    <TableHead className="text-xs text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido?.detalles?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">
                        {d.productoNombre}
                        <span className="block text-xs text-muted-foreground font-normal">
                          {d.productoSku}
                        </span>
                        {d.notaPersonalizacion && (
                          <span className="block text-xs text-muted-foreground italic font-normal">
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
                      <TableCell colSpan={3} className="text-sm text-muted-foreground text-center py-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={generarPDF} className="gap-1.5">
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta dirección?")) return;

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
                      onClick={() => handleDelete(dir.id)}
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

  const { data: zonas } = useSWR<ZonaDomicilioResponse[]>(
    selectedSedeId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${selectedSedeId}`
      : null,
    fetcher
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

    if (!form.zonaDomicilioId) {
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
                <SelectValue
                  placeholder={
                    !sedes ? "Cargando sedes..." : "Selecciona una sede"
                  }
                />
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
          {zonas && zonas.length > 0 && form.ciudad && (
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
