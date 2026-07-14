"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, Pencil, ShoppingBag, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore, getPrecioFinal } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import ComplementosSugeridos from "./ComplementosSugeridos";

export default function CartDrawer() {
  const { items, sedeActual, removeItem, updateQuantity, updateNota, clearCart, drawerOpen, setDrawerOpen } =
    useCartStore();
  const { isAuthenticated, rol, isHydrated } = useAuthStore();
  const router = useRouter();
  const [notasAbiertas, setNotasAbiertas] = useState<Set<string>>(new Set());

  const total = items.reduce((sum, item) => sum + getPrecioFinal(item) * item.cantidad, 0);

  const toggleNota = (id: string) => {
    setNotasAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePagar = () => {
    setDrawerOpen(false);
    if (!isHydrated) return;
    if (!isAuthenticated || rol !== "CLIENTE") {
      router.push("/tienda/auth?redirect=/tienda/checkout");
      return;
    }
    router.push("/tienda/checkout");
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger className="relative inline-flex items-center justify-center rounded-md text-sm font-medium hover:text-brand-mustard transition-colors h-10 w-10">
        <ShoppingCart className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-hidden">
        <SheetHeader className="text-center py-2">
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12 px-6">
            <ShoppingBag className="h-16 w-16 text-brand-rose/60" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-stone-700">Tu carrito está vacío</h3>
              <p className="text-sm text-stone-400 mt-1">
                Explora nuestros productos y encuentra el regalo perfecto
              </p>
            </div>
            {sedeActual && (
              <div className="w-full">
                <ComplementosSugeridos
                  sede={sedeActual}
                  excludeIds={new Set()}
                  titulo="Descubre más"
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0 px-4">
              <div className="space-y-2.5 pt-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200">
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium text-stone-800 line-clamp-1">
                          {item.nombre}
                        </h4>
                        <span className="text-sm font-semibold text-stone-800 whitespace-nowrap">
                          ${(getPrecioFinal(item) * item.cantidad).toLocaleString("es-CO")}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {item.descuentoPorcentaje > 0 ? (
                          <>
                            <span className="line-through mr-1">
                              ${item.precio.toLocaleString("es-CO")}
                            </span>
                            <span className="text-[var(--color-brand-sage)] font-medium">
                              ${getPrecioFinal(item).toLocaleString("es-CO")}
                            </span>{" "}
                            c/u
                          </>
                        ) : (
                          `$${item.precio.toLocaleString("es-CO")} c/u`
                        )}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md"
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.cantidad - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 text-center text-xs font-medium text-stone-700">
                          {item.cantidad}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md"
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 rounded-md border transition-all duration-200 ${
                            item.notaPersonalizacion
                              ? "border-[var(--color-brand-mustard)] bg-[var(--color-brand-mustard)]/15 text-[var(--color-brand-mustard-dark)]"
                              : "border-dashed border-[var(--color-brand-mustard)]/40 text-[var(--color-brand-mustard)] hover:bg-[var(--color-brand-mustard)]/10"
                          }`}
                          onClick={() => toggleNota(item.id)}
                          title={
                            item.notaPersonalizacion
                              ? "Editar nota personalizada"
                              : "Agregar nota personalizada"
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      {notasAbiertas.has(item.id) && (
                        <Textarea
                          placeholder="Cuéntanos cómo quieres tu regalo..."
                          className="mt-1.5 h-14 text-xs border-brand-rose/30 bg-brand-rose/5 focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20 transition-all duration-200"
                          value={item.notaPersonalizacion || ""}
                          onChange={(e) => updateNota(item.id, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {sedeActual && items.length > 0 && (
              <div className="px-4 py-2 border-t border-stone-100">
                <ComplementosSugeridos
                  sede={sedeActual}
                  excludeIds={new Set(items.map((i) => i.id))}
                  titulo="Complementa tu pedido"
                />
              </div>
            )}

            <div className="px-4 py-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-stone-800">Total</span>
                <span className="text-base font-bold text-stone-800">
                  ${total.toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            <SheetFooter className="flex-row gap-2 px-4 pb-4 pt-0 mt-0">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1 h-10 text-sm"
              >
                Vaciar carrito
              </Button>
              {sedeActual ? (
                <Button
                  onClick={handlePagar}
                  className="flex-[2] h-10 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-semibold text-sm transition-all duration-200"
                >
                  Pagar
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button disabled className="flex-[2] h-10">
                  Selecciona una sede
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
