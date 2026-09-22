"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import Cookies from "js-cookie";
import useSWR from "swr";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore, getPrecioFinal } from "@/store/useCartStore";
import { CrearPedidoResponse, ConfiguracionTiendaDTO, DireccionResponse, EntregaConfigDTO, Sede, SlotEntregaDTO, ZonaDomicilioResponse } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { hoyLocalISO, parseFecha } from "@/lib/fechas";
import { trackMetaEvent } from "@/lib/meta-pixel";
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
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");

  // ── Fetch de zonas (para calcular costoEnvio) ─────────────
  const { data: zonas } = useSWR<ZonaDomicilioResponse[]>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${sedeActual.id}`
      : null,
    fetcher
  );

  // ── Sedes frescas + config general: el número de sedeActual puede ser
  // stale (persistido en localStorage antes de corregir la BD). Se usa el
  // fresco para el modal de WhatsApp, con fallback al general.
  const { data: sedes } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher
  );
  const { data: configuracion } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const sedeFresca = sedeActual
    ? sedes?.find((s) => s.id === sedeActual.id) ?? sedeActual
    : null;

  // ── Fetch de direcciones (SWR deduplica con DireccionSelector) ─
  const { data: direcciones } = useSWR<DireccionResponse[]>(
    isAuthenticated && rol === "CLIENTE" ? API_DIRECCIONES_URL : null,
    fetcher
  );

  // ── Config de entrega por sede (corte, ventana, bloqueos) ──
  const { data: entregaConfig } = useSWR<EntregaConfigDTO>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes/${sedeActual.id}/entrega-config`
      : null,
    fetcher
  );

  // ── Slots del día seleccionado ──
  const { data: slots, isLoading: slotsLoading } = useSWR<SlotEntregaDTO[]>(
    sedeActual && fechaEntrega
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes/${sedeActual.id}/slots?fecha=${fechaEntrega}`
      : null,
    fetcher
  );

  const fechaMinima = useMemo(() => hoyLocalISO(), []);

  const fechaMaxima = useMemo(() => {
    const ventana = entregaConfig?.ventanaMaxDias ?? 30;
    const d = parseFecha(hoyLocalISO());
    d.setDate(d.getDate() + ventana);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, [entregaConfig]);

  const fechaBloqueada = useMemo(
    () => (fechaEntrega ? entregaConfig?.fechasBloqueadas?.includes(fechaEntrega) : false),
    [fechaEntrega, entregaConfig]
  );

  const diaSemanaCerrado = useMemo(() => {
    if (!fechaEntrega || !entregaConfig?.diasNoEntrega?.length) return false;
    const [y, m, d] = fechaEntrega.split("-").map(Number);
    if (!y || !m || !d) return false;
    const dow = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][
      new Date(y, m - 1, d).getDay()
    ];
    return entregaConfig.diasNoEntrega.includes(dow);
  }, [fechaEntrega, entregaConfig]);

  const slotsManana = useMemo(() => slots?.filter((s) => s.inicio < "12:00") ?? [], [slots]);
  const slotsTarde = useMemo(() => slots?.filter((s) => s.inicio >= "12:00") ?? [], [slots]);
  const [slotsExpandido, setSlotsExpandido] = useState(true);
  const slotSeleccionado = useMemo(
    () => slots?.find((s) => s.inicio === horaEntrega),
    [slots, horaEntrega]
  );
  const fechaEntregaCorta = useMemo(() => {
    if (!fechaEntrega) return "";
    const [y, m, d] = fechaEntrega.split("-");
    return y && m && d ? `${d}/${m}/${y}` : fechaEntrega;
  }, [fechaEntrega]);

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

  // ── Meta Pixel: InitiateCheckout (una sola vez al entrar con items) ──
  // El costo de envío se resuelve async (zonas + dirección), por eso se envía
  // el subtotal real del carrito, disponible de forma síncrona al montar.
  const initiateCheckoutSent = useRef(false);
  useEffect(() => {
    if (initiateCheckoutSent.current) return;
    if (!isHydrated || !isAuthenticated || rol !== "CLIENTE" || items.length === 0) return;
    initiateCheckoutSent.current = true;
    trackMetaEvent("InitiateCheckout", {
      value: items.reduce((sum, item) => sum + getPrecioFinal(item) * item.cantidad, 0),
      currency: "COP",
      num_items: items.reduce((sum, item) => sum + item.cantidad, 0),
      content_ids: items.map((item) => String(item.id)),
    });
  }, [isHydrated, isAuthenticated, rol, items]);

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

  // ── Widget Wompi ──────────────────────────────────────────
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
        // Compra confirmada por Wompi: único punto donde se reporta el Purchase,
        // con el total real del pedido calculado por el backend.
        trackMetaEvent("Purchase", {
          value: data.total,
          currency: "COP",
          num_items: items.reduce((sum, item) => sum + item.cantidad, 0),
          content_ids: items.map((item) => String(item.id)),
        });
        sessionStorage.removeItem('pedidoPendiente');
        clearCart();
        toast.success("¡Pago aprobado!");
        router.push("/tienda/mi-cuenta");
      } else if (status === "DECLINED" || status === "ERROR") {
        // Wompi rechaza reuso de referencia: limpiar para forzar nuevo pedido en próximo intento
        sessionStorage.removeItem('pedidoPendiente');
        toast.error("El pago fue rechazado o hubo un error.");
      } else if (!result.transaction) {
        // Usuario cerró el widget sin completar pago
        sessionStorage.removeItem('pedidoPendiente');
      } else {
        sessionStorage.removeItem('pedidoPendiente');
      }
    });
  };

  // ── Crear pedido ─────────────────────────────────────────────
  const isButtonDisabled =
    !selectedDireccionId || !aceptaTerminos || isSubmitting || !fechaEntrega || !horaEntrega;

  const handleCrearPedido = async () => {
    if (!selectedDireccionId) {
      toast.error("Selecciona una dirección de entrega.");
      return;
    }

    if (!fechaEntrega || !horaEntrega) {
      toast.error("Elige la fecha y hora de entrega (obligatorio).");
      return;
    }

    if (!sedeActual) {
      toast.error("No se encontró la sede del pedido.");
      return;
    }

    // Eliminar cualquier referencia previa: Wompi exige referencia única por transacción
    // Reusar referencia causa "La referencia ya ha sido usada"
    const pedidoGuardadoRaw = sessionStorage.getItem('pedidoPendiente');
    if (pedidoGuardadoRaw) {
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
          fechaEntrega,
          horaEntrega,
          aceptaTerminos,
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

        if (errorCodigo === "FECHA_ENTREGA_INVALIDA") {
          toast.error(errorMessage);
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
        timestamp: Date.now(),
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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
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
                  maxLength={255}
                  className="mt-1 border-[var(--color-brand-rose)] focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 break-words"
                />
              </div>

              {/* Fecha y hora de entrega (obligatorio) */}
              <div>
                <Label htmlFor="fecha-entrega" className="text-sm text-stone-600 font-medium">
                  Fecha y hora de entrega <span className="text-red-500">*</span>
                </Label>
                <input
                  id="fecha-entrega"
                  type="date"
                  value={fechaEntrega}
                  min={fechaMinima}
                  max={fechaMaxima}
                  onChange={(e) => {
                    setFechaEntrega(e.target.value);
                    setHoraEntrega("");
                    setSlotsExpandido(true);
                  }}
                  className="mt-1 w-full rounded-md border border-[var(--color-brand-rose)] px-3 py-2 text-sm focus:border-[var(--color-brand-mustard)] focus:outline-none"
                />
                {fechaBloqueada && (
                  <p className="mt-1 text-xs text-red-600">
                    Esa fecha no esta disponible para entrega. Elige otra.
                  </p>
                )}
                {!fechaBloqueada && diaSemanaCerrado && (
                  <p className="mt-1 text-xs text-red-600">
                    Ese dia la sede no entrega a domicilio. Elige otra fecha.
                  </p>
                )}

                {fechaEntrega && !fechaBloqueada && !diaSemanaCerrado && (
                  <div className="mt-2">
                    {slotsLoading && <p className="text-xs text-stone-500">Cargando horarios...</p>}
                    {!slotsLoading && slots && slots.length > 0 && horaEntrega && slotSeleccionado && !slotsExpandido ? (
                      <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-brand-mustard)] bg-[var(--color-brand-mustard)]/10 px-3 py-2">
                        <p className="text-sm font-medium text-stone-700">
                          {fechaEntregaCorta} - {slotSeleccionado.etiqueta.split(" ")[0]}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSlotsExpandido(true)}
                          className="text-xs font-semibold text-[var(--color-brand-mustard-dark)] underline hover:text-[var(--color-brand-mustard)]"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      !slotsLoading && slots && slots.length > 0 && (
                        <>
                          {slotsManana.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-stone-500 mb-1">Manana</p>
                              <div className="flex flex-wrap gap-1.5">
                                {slotsManana.map((s) => (
                                  <button
                                    key={s.inicio}
                                    type="button"
                                    disabled={!s.disponible}
                                    title={s.disponible ? s.etiqueta : s.motivo ?? "No disponible"}
                                    onClick={() => {
                                      setHoraEntrega(s.inicio);
                                      setSlotsExpandido(false);
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                      horaEntrega === s.inicio
                                        ? "bg-[var(--color-brand-mustard)] text-stone-900 border-[var(--color-brand-mustard)]"
                                        : s.disponible
                                          ? "bg-white text-stone-700 border-stone-300 hover:border-[var(--color-brand-mustard)]"
                                          : "bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed"
                                    }`}
                                  >
                                    {s.etiqueta.split(" ")[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {slotsTarde.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-stone-500 mb-1">Tarde</p>
                              <div className="flex flex-wrap gap-1.5">
                                {slotsTarde.map((s) => (
                                  <button
                                    key={s.inicio}
                                    type="button"
                                    disabled={!s.disponible}
                                    title={s.disponible ? s.etiqueta : s.motivo ?? "No disponible"}
                                    onClick={() => {
                                      setHoraEntrega(s.inicio);
                                      setSlotsExpandido(false);
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                      horaEntrega === s.inicio
                                        ? "bg-[var(--color-brand-mustard)] text-stone-900 border-[var(--color-brand-mustard)]"
                                        : s.disponible
                                          ? "bg-white text-stone-700 border-stone-300 hover:border-[var(--color-brand-mustard)]"
                                          : "bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed"
                                    }`}
                                  >
                                    {s.etiqueta.split(" ")[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {slots.every((s) => !s.disponible) && (
                            <p className="mt-2 text-xs text-red-600">
                              No quedan horarios ese dia. Elige otra fecha (pedidos despues de las{" "}
                              {entregaConfig?.horaCorte ?? "15:30"} van al dia siguiente).
                            </p>
                          )}
                        </>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                {/* TODO legal: El copy del checkbox de T&C debe ser revisado por abogado antes de lanzamiento.
                    Debe mencionar expresamente la excepción de retracto para bienes perecederos
                    (Ley 1480/2011 art. 47 lit. j). No modificar el texto sin firma del abogado. */}
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
              {(!fechaEntrega || !horaEntrega) && (
                <p className="text-center text-xs text-[var(--color-brand-rose-dark)]">
                  Elige fecha y hora de entrega (obligatorio).
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
        whatsappNumber={sedeFresca?.telefonoWhatsapp || ""}
        fallbackWhatsappNumber={configuracion?.whatsappGeneral}
        notasEntrega={notasEntrega}
      />
    </>
  );
}
