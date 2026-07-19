"use client";

import Image from "next/image";
import { useCartStore, CartItem, getPrecioFinal } from "@/store/useCartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatPrice(price: number): string {
  return price.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

function ItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--color-brand-rose)]/10">
        {item.imagen_url ? (
          <Image
            src={item.imagen_url}
            alt={item.nombre}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-brand-rose-dark)] text-xs">
            Sin img
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words line-clamp-2">{item.nombre}</p>
        <p className="text-xs text-muted-foreground">
          Cant. {item.cantidad} ×{" "}
          {item.descuentoPorcentaje > 0 ? (
            <>
              <span className="line-through mr-1">{formatPrice(item.precio)}</span>
              <span className="text-[var(--color-brand-mustard)] font-medium">{formatPrice(getPrecioFinal(item))}</span>
            </>
          ) : (
            <span className="text-[var(--color-brand-sage)]">{formatPrice(item.precio)}</span>
          )}
        </p>
        {item.notaPersonalizacion && (
          <p className="text-xs text-muted-foreground/70 italic truncate">
            📝 {item.notaPersonalizacion}
          </p>
        )}
      </div>

      <p className={`text-sm font-medium shrink-0 ${item.descuentoPorcentaje > 0 ? "text-[var(--color-brand-mustard-dark)]" : "text-[var(--color-brand-sage)]"}`}>
        {formatPrice(getPrecioFinal(item) * item.cantidad)}
      </p>
    </div>
  );
}

export default function ResumenPedido({
  costoEnvio = 0,
  zonaNombre,
}: {
  costoEnvio?: number;
  zonaNombre?: string;
}) {
  const items = useCartStore((state) => state.items);
  const sedeActual = useCartStore((state) => state.sedeActual);

  const subtotal = items.reduce(
    (sum, item) => sum + getPrecioFinal(item) * item.cantidad,
    0
  );
  const total = subtotal + costoEnvio;

  if (items.length === 0) {
    return (
      <Card className="border-[var(--color-brand-rose)]/20">
        <CardContent className="py-6 text-center text-[var(--color-brand-rose-dark)]">
          Tu carrito está vacío.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--color-brand-rose)]/20">
      <CardHeader className="border-b border-[var(--color-brand-rose)]/10">
        <CardTitle className="font-heading text-base text-brand-mustard">Resumen del pedido</CardTitle>
        {sedeActual && (
          <p className="text-xs text-brand-sage">
            Sede: {sedeActual.nombre} — {sedeActual.ciudad}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-0">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}

        <Separator className="my-3 bg-[var(--color-brand-rose)]/20" />

        <div className="flex items-center justify-between text-sm text-[var(--color-brand-sage)]">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {costoEnvio > 0 && (
          <div className="flex items-center justify-between text-sm text-[var(--color-brand-sage)]">
            <span>Envío</span>
            <span>{formatPrice(costoEnvio)}</span>
          </div>
        )}

        <Separator className="my-3 bg-[var(--color-brand-rose)]/20" />

        <div className="flex items-center justify-between font-bold text-[var(--color-brand-mustard-dark)]">
          <span>Total a Pagar</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
