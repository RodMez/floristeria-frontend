"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { CrearPedidoResponse } from "@/types";
import DireccionSelector from "@/components/checkout/DireccionSelector";
import ResumenPedido from "@/components/checkout/ResumenPedido";
import { Button } from "@/components/ui/button";
import { LoaderIcon, ShoppingCartIcon, MapPinIcon } from "lucide-react";

const API_PEDIDOS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`;

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, rol, isHydrated } = useAuthStore();
  const { items, clearCart, sedeActual } = useCartStore();

  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(false);

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
      <div className="container mx-auto max-w-5xl px-4 py-10 flex items-center justify-center">
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
  if (items.length === 0 && !pedidoExitoso) {
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

  // ── Pedido exitoso ──────────────────────────────────────────
  if (pedidoExitoso) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <ShoppingCartIcon className="size-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">¡Pedido creado!</h2>
          <p className="text-muted-foreground mb-6">
            Pedido creado. Redirigiendo a la pasarela de pago...
          </p>
          <LoaderIcon className="mx-auto size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Crear pedido ─────────────────────────────────────────────
  const isButtonDisabled = !selectedDireccionId || isSubmitting;

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
        const errorBody = await res.text().catch(() => "");
        throw new Error(errorBody || `Error ${res.status}`);
      }

      const data = (await res.json()) as CrearPedidoResponse;
      clearCart();
      setPedidoExitoso(true);
      toast.success(`Pedido #${data.pedidoId} creado por ${data.total.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })}`);
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
  );
}
