"use client";

import Image from "next/image";
import { useCartStore, CartItem } from "@/store/useCartStore";
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
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imagen_url ? (
          <Image
            src={item.imagen_url}
            alt={item.nombre}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            Sin img
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.nombre}</p>
        <p className="text-xs text-muted-foreground">
          Cant. {item.cantidad} × {formatPrice(item.precio)}
        </p>
        {item.notaPersonalizacion && (
          <p className="text-xs text-muted-foreground/70 italic truncate">
            📝 {item.notaPersonalizacion}
          </p>
        )}
      </div>

      <p className="text-sm font-medium shrink-0">
        {formatPrice(item.precio * item.cantidad)}
      </p>
    </div>
  );
}

export default function ResumenPedido() {
  const items = useCartStore((state) => state.items);
  const sedeActual = useCartStore((state) => state.sedeActual);

  const total = items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Tu carrito está vacío.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen del pedido</CardTitle>
        {sedeActual && (
          <p className="text-xs text-muted-foreground">
            Sede: {sedeActual.nombre} — {sedeActual.ciudad}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-0">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}

        <Separator className="my-3" />

        <div className="flex items-center justify-between font-medium">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
