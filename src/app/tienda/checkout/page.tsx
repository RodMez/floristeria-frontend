"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import Cookies from "js-cookie";
import useSWR from "swr";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { CrearPedidoResponse, DireccionResponse, ZonaDomicilioResponse } from "@/types";
import { fetcher } from "@/lib/fetcher";
import DireccionSelector from "@/components/checkout/DireccionSelector";
import ResumenPedido from "@/components/checkout/ResumenPedido";
import ZonaExcluidaModal from "@/components/checkout/ZonaExcluidaModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderIcon, ShoppingCartIcon, MapPinIcon, LogInIcon, ShoppingBag, Lock } from "lucide-react";

const API_PEDIDOS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`;
const API_DIRECCIONES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, rol, isHydrated } = useAuthStore();
  const { items, clearCart, sedeActual } = useCartStore();

  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notasEntrega, setNotasEntrega] = useState("");
  const [showZonaExcluida, setShowZonaExcluida] = useState(false);

  // ── Fetch de zonas (para calcular costoEnvio) ─────────────
  const { data: zonas } = useSWR<ZonaDomicilioResponse[]>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${sedeActual.id}`
      : null,
    fetcher
  );

  // ── Fetch de direcciones (SWR deduplica con DireccionSelector) ─
  const { data: direcciones } = useSWR<DireccionResponse[]>(
    isAuthenticated && rol === "CLIENTE" ? API_DIRECCIONES_URL : null,
    fetcher
  );

  // ── Derivar costoEnvio desde la dirección seleccionada ────
  const direccionSeleccionada = useMemo(
    () => direcciones?.find((d) => d.id === selectedDireccionId),
    [direcciones, selectedDireccionId]
  );

  const zonaIdDesdeDireccion = direccionSeleccionada?.zonaDomicilioId;
  const zonaDesdeDireccion = zonas?.find((z) => z.id === zonaIdDesdeDireccion);
  const costoEnvio = zonaDesdeDireccion?.precio ?? 0;
  const zonaNombre = zonaDesdeDireccion
    ? `${zonaDesdeDireccion.localidad}${zonaDesdeDireccion.barrio ? ` - ${zonaDesdeDireccion.barrio}` : ""}`
    : undefined;

  // ── Protección de ruta ──────────────────────────────────────
  useEffect(() => {
    if (isHydrated && (!isAuthenticated || rol !== "CLIENTE")) {
      router.replace("/tienda/auth?redirect=/tienda/checkout");
    }
  }, [isHydrated, isAuthenticated, rol, router]);

  // ── Guardia de hidratación ───────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── No autenticado → mensaje para iniciar sesión ────────────
  if (!isAuthenticated || rol !== "CLIENTE") {
    return (
      <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-16">
          <LogInIcon className="mx-auto mb-4 size-12 text-[var(--color-brand-rose-dark)]" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión para continuar</h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Debes iniciar sesión o registrarte para ver tus direcciones de entrega y
            poder completar la compra.
          </p>
          <Button
            onClick={() => router.replace("/tienda/auth?redirect=/tienda/checkout")}
            className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
          >
            Iniciar sesión / Registrarse
          </Button>
        </div>
      </div>
      </div>
    );
  }

  // ── Carrito vacío ────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-16">
          <ShoppingCartIcon className="mx-auto mb-4 size-12 text-[var(--color-brand-rose-dark)]" />
          <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-stone-500 mb-6">
            Agrega productos antes de proceder al checkout.
          </p>
          <Button
            onClick={() => router.push("/tienda")}
            className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold"
          >
            Ir a la tienda
          </Button>
        </div>
      </div>
      </div>
    );
  }

  // ── Idempotencia del Widget Wompi ────────────────────────────
  const abrirWidgetWompi = (data: CrearPedidoResponse) => {
    const checkout = new (window as any).WidgetCheckout({
      currency: "COP",
      amountInCents: data.montoEnCentavos,
      reference: data.referenciaWompi,
      publicKey: data.publicKeyWompi,
      signature: { integrity: data.firmaIntegridad },
    });

    checkout.open(function (result: any) {
      const status = result.transaction?.status;
      if (status === "APPROVED") {
        sessionStorage.removeItem('pedidoPendiente');
        clearCart();
        toast.success("¡Pago aprobado!");
        router.push("/tienda/mi-cuenta");
      } else if (status === "DECLINED" || status === "ERROR") {
        toast.error("El pago fue rechazado o hubo un error.");
      }
    });
  };

  // ── Crear pedido ─────────────────────────────────────────────
  const isButtonDisabled = !selectedDireccionId || !aceptaTerminos || isSubmitting;

  const handleCrearPedido = async () => {
    if (!selectedDireccionId) {
      toast.error("Selecciona una dirección de entrega.");
      return;
    }

    if (!sedeActual) {
      toast.error("No se encontró la sede del pedido.");
      return;
    }

    const pedidoGuardadoRaw = sessionStorage.getItem('pedidoPendiente');
    if (pedidoGuardadoRaw) {
      const { data, itemsSnapshot, direccionId, sedeId } = JSON.parse(pedidoGuardadoRaw);
      const itemsActuales = items.map(i => ({ id: i.id, cantidad: i.cantidad, notaPersonalizacion: i.notaPersonalizacion }));
      const carritoIgual = JSON.stringify(itemsActuales) === JSON.stringify(itemsSnapshot);
      if (carritoIgual && direccionId === selectedDireccionId && sedeId === sedeActual?.id) {
        abrirWidgetWompi(data);
        return;
      }
      sessionStorage.removeItem('pedidoPendiente');
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("token");

      const detalles = items.map((item) => ({
        productoId: Number(item.id),
        cantidad: item.cantidad,
        notaPersonalizacion: item.notaPersonalizacion || undefined,
      }));

      const res = await fetch(API_PEDIDOS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sedeId: sedeActual.id,
          direccionId: selectedDireccionId,
          detalles,
          notasEntrega: notasEntrega || undefined,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error ${res.status}`;
        let errorCodigo = "";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.mensaje || errorJson.message || errorText;
          errorCodigo = errorJson.codigo || "";
        } catch {
          errorMessage = errorText;
        }

        if (errorCodigo === "ZONA_EXCLUIDA") {
          setShowZonaExcluida(true);
          setIsSubmitting(false);
          return;
        }

        throw new Error(errorMessage);
      }

      const data = (await res.json()) as CrearPedidoResponse;
      sessionStorage.setItem('pedidoPendiente', JSON.stringify({
        data,
        itemsSnapshot: items.map(i => ({ id: i.id, cantidad: i.cantidad, notaPersonalizacion: i.notaPersonalizacion })),
        direccionId: selectedDireccionId,
        sedeId: sedeActual.id,
      }));
      abrirWidgetWompi(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el pedido."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render principal ─────────────────────────────────────────
  return (
    <>
      <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30 overflow-x-hidden">
      <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-brand-mustard">Checkout</h1>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr]">
        {/* ── Columna 1: Direcciones ────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="size-5 text-[var(--color-brand-rose-dark)]" />
            <h2 className="font-heading text-lg font-semibold text-[var(--color-brand-rose-dark)]">Dirección de entrega</h2>
          </div>

          <DireccionSelector
            enabled={isAuthenticated && rol === "CLIENTE"}
            selectedDireccionId={selectedDireccionId}
            onSelect={setSelectedDireccionId}
          />
        </section>

        {/* ── Columna 2: Resumen del pedido ─────────────────── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ResumenPedido costoEnvio={costoEnvio} zonaNombre={zonaNombre} />
        </aside>

        {/* ── Columna 3: Notas + Términos + CTA ─────────────── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="border-[var(--color-brand-rose)]/20">
            <CardHeader className="border-b border-[var(--color-brand-rose)]/10">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
                  <Lock className="size-4 text-[var(--color-brand-mustard-dark)]" />
                </div>
                <CardTitle className="font-heading text-sm text-brand-mustard">Confirmar pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="notas-entrega" className="text-sm text-stone-600 font-medium">
                  Notas de entrega <span className="text-xs text-stone-400">(opcional)</span>
                </Label>
                <Textarea
                  id="notas-entrega"
                  placeholder="Ej: Llamar antes de llegar, dejar con el portero..."
                  value={notasEntrega}
                  onChange={(e) => setNotasEntrega(e.target.value)}
                  rows={3}
                  className="mt-1 border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 break-words"
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="acepta-terminos"
                  checked={aceptaTerminos}
                  onCheckedChange={(checked) => setAceptaTerminos(checked === true)}
                  disabled={isSubmitting}
                  className="mt-1 shrink-0"
                />
                <label htmlFor="acepta-terminos" className="text-sm font-normal leading-snug cursor-pointer text-stone-600">
                  Acepto los<span className="hidden md:inline"><br /></span>{" "}
                  <a href="/legal/terminos" target="_blank" className="underline text-brand-mustard hover:text-brand-mustard-dark font-medium">
                    Términos y Condiciones
                  </a>
                </label>
              </div>

              <Button
                size="lg"
                className="w-full bg-brand-rose-dark text-white hover:bg-brand-mustard hover:text-stone-900 font-extrabold"
                disabled={isButtonDisabled}
                onClick={handleCrearPedido}
              >
                {isSubmitting ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" />
                    Procesando pedido...
                  </>
                ) : (
                  "Confirmar y proceder al pago"
                )}
              </Button>

              {!selectedDireccionId && (
                <p className="text-center text-xs text-[var(--color-brand-rose-dark)]">
                  Selecciona una dirección para continuar.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      </div>
      </div>

      <ZonaExcluidaModal
        open={showZonaExcluida}
        onOpenChange={setShowZonaExcluida}
        direccion={direccionSeleccionada ?? null}
        whatsappNumber={sedeActual?.telefonoWhatsapp || ""}
      />
    </>
  );
}
