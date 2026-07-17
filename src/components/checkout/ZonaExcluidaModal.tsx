"use client";

import { useMemo } from "react";
import { useCartStore, getPrecioFinal } from "@/store/useCartStore";
import { DireccionResponse, ConfiguracionTiendaDTO, ProductoCatalogo } from "@/types";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, MessageCircle, MapPin, ShoppingBag } from "lucide-react";

interface ZonaExcluidaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direccion: DireccionResponse | null;
  whatsappNumber: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

export default function ZonaExcluidaModal({
  open,
  onOpenChange,
  direccion,
  whatsappNumber,
}: ZonaExcluidaModalProps) {
  const items = useCartStore((state) => state.items);
  const sedeActual = useCartStore((state) => state.sedeActual);

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );
  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";

  const { data: catalogo } = useSWR<ProductoCatalogo[]>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sedeActual.id}`
      : null,
    fetcher
  );

  const skuMap = useMemo(() => {
    if (!catalogo) return new Map<string, string>();
    return new Map(catalogo.map((p) => [String(p.productoId), p.sku]));
  }, [catalogo]);

  const subtotal = items.reduce(
    (sum, item) => sum + getPrecioFinal(item) * item.cantidad,
    0
  );

  const zonaNombre = direccion?.zonaDomicilioNombre || "Zona excluida";

  const cleanNumber = whatsappNumber.replace(/\D/g, "");

  const emojisFlores = ["🌺", "🌿", "🌷", "🌹", "🌻", "💐"];

  const mensaje = [
    `🌸 *${sitioNombre}${sedeActual?.nombre ? ` - ${sedeActual.nombre}` : ""}* 🌸`,
    "",
    `Hola, me gustaría realizar un pedido:`,
    "",
    `─────────────────`,
    `*🛒 Productos*`,
    `─────────────────`,
    ...items.flatMap((item, idx) => {
      const sku = item.sku || skuMap.get(item.id);
      const subtotalItem = getPrecioFinal(item) * item.cantidad;
      const emoji = emojisFlores[idx % emojisFlores.length];
      const lineaProducto = `${emoji} • *${item.nombre}*`;
      const lineaDetalle = `        x${item.cantidad} - $${subtotalItem.toLocaleString('es-CO')}${sku ? ` | SKU: *${sku}*` : ""}`;
      const lineaNota = item.notaPersonalizacion ? `  📝 _${item.notaPersonalizacion}_` : null;
      return [lineaProducto, lineaDetalle, lineaNota].filter(Boolean);
    }),
    "",
    `─────────────────`,
    `*📍 Dirección de entrega*`,
    `─────────────────`,
    `🏠 ${direccion?.direccion || "No especificada"}, ${direccion?.ciudad || ""}`,
    direccion?.detalles ? `📝 Detalles: ${direccion.detalles}` : null,
    `🏘️ Zona: ${zonaNombre}`,
    "",
    `─────────────────`,
    `*💰 Total*`,
    `─────────────────`,
    `*$${subtotal.toLocaleString('es-CO')}*`,
    "",
    `_Pedido generado desde la tienda - zona sin domicilio disponible_ ✨`
  ].filter(l => l !== null).join('\n');

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(mensaje)}`;

  const handleWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-brand-rose/30">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-rose/10 mb-2">
            <AlertTriangle className="size-6 text-brand-rose-dark" />
          </div>
          <DialogTitle className="text-center text-xl">
            Zona no disponible para domicilio
          </DialogTitle>
          <DialogDescription className="text-center">
            La zona <span className="font-semibold text-foreground">{zonaNombre}</span> no tiene
            servicio de domicilio disponible. Pero puedes hacer tu pedido directamente por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-brand-rose/5 border border-brand-rose/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShoppingBag className="size-4 text-brand-mustard" />
            Resumen del pedido
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.nombre} <span className="text-xs">x{item.cantidad}</span>
                </span>
                <span className="font-medium">{formatPrice(getPrecioFinal(item) * item.cantidad)}</span>
              </div>
            ))}
          </div>

          <Separator className="bg-brand-rose/20" />

          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="text-brand-mustard-dark">{formatPrice(subtotal)}</span>
          </div>

          {direccion && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
              <MapPin className="size-3.5 mt-0.5 shrink-0" />
              <span>{direccion.direccion}, {direccion.ciudad}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-brand-mustard hover:bg-brand-mustard-dark text-stone-900 gap-2"
          >
            <MessageCircle className="size-4" />
            Enviar pedido por WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-brand-rose/30 hover:bg-brand-rose/5"
          >
            Elegir otra dirección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
