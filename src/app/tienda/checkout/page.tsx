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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderIcon, ShoppingCartIcon, MapPinIcon, LogInIcon } from "lucide-react";

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
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-16">
          <LogInIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión para continuar</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Debes iniciar sesión o registrarte para ver tus direcciones de entrega y
            poder completar la compra.
          </p>
          <Button
            onClick={() => router.replace("/tienda/auth?redirect=/tienda/checkout")}
          >
            Iniciar sesión / Registrarse
          </Button>
        </div>
      </div>
    );
  }

  // ── Carrito vacío ────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-16">
          <ShoppingCartIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">
            Agrega productos antes de proceder al checkout.
          </p>
          <Button onClick={() => router.push("/tienda")}>
            Ir a la tienda
          </Button>
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
      <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Columna izquierda: Direcciones ─────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Dirección de entrega</h2>
          </div>

          <DireccionSelector
            enabled={isAuthenticated && rol === "CLIENTE"}
            selectedDireccionId={selectedDireccionId}
            onSelect={setSelectedDireccionId}
          />

          <div className="mt-4">
            <Label htmlFor="notas-entrega" className="text-sm text-muted-foreground">
              Notas de entrega <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-1">
              Instrucciones sobre cuándo o cómo entregar el pedido
            </p>
            <Textarea
              id="notas-entrega"
              placeholder="Ej: Llamar antes de llegar, entregar solo en horario de la mañana, dejar con el conserje..."
              value={notasEntrega}
              onChange={(e) => setNotasEntrega(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </section>

        {/* ── Columna derecha: Resumen + Acción ──────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ResumenPedido costoEnvio={costoEnvio} zonaNombre={zonaNombre} />

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acepta-terminos"
              checked={aceptaTerminos}
              onCheckedChange={(checked) => setAceptaTerminos(checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor="acepta-terminos" className="text-sm font-normal leading-snug cursor-pointer">
              Acepto los{" "}
              <a href="/legal/terminos" target="_blank" className="underline text-primary hover:text-primary/80">
                Términos y Condiciones
              </a>{" "}
            </Label>
          </div>

          <Button
            size="lg"
            className="w-full"
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
            <p className="text-center text-xs text-muted-foreground">
              Selecciona una dirección para continuar.
            </p>
          )}
        </aside>
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
