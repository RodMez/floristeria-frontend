"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { CrearPedidoResponse } from "@/types";
import DireccionSelector from "@/components/checkout/DireccionSelector";
import ResumenPedido from "@/components/checkout/ResumenPedido";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoaderIcon, ShoppingCartIcon, MapPinIcon } from "lucide-react";

const API_PEDIDOS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`;

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, rol, isHydrated } = useAuthStore();
  const { items, clearCart, sedeActual } = useCartStore();

  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── ¿El usuario está autenticado como CLIENTE? ──────────────
  const isAuthClient = isHydrated && isAuthenticated && rol === "CLIENTE";

  // ── Protección de ruta ──────────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthClient) {
      router.replace("/tienda/auth?redirect=/tienda/checkout");
    }
  }, [isHydrated, isAuthClient, router]);

  // ── Guardia de hidratación ───────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── No autenticado → no renderizar nada (ya se redirigió) ───
  if (!isAuthClient) {
    return null;
  }

  // ── A partir de aquí el usuario ESTÁ autenticado como CLIENTE ─
  // isAuthClient = true → seguro para pasar enabled al DireccionSelector

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
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error ${res.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.mensaje || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as CrearPedidoResponse;

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
          clearCart();
          toast.success("¡Pago aprobado!");
          router.push("/tienda/mi-cuenta");
        } else if (status === "DECLINED" || status === "ERROR") {
          toast.error("El pago fue rechazado o hubo un error.");
        }
      });
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
            enabled={isAuthClient}
            selectedDireccionId={selectedDireccionId}
            onSelect={setSelectedDireccionId}
          />
        </section>

        {/* ── Columna derecha: Resumen + Acción ──────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ResumenPedido />

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
    </>
  );
}
