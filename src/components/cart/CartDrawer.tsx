"use client";

import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore, getPrecioFinal } from "@/store/useCartStore";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { items, sedeActual, removeItem, updateQuantity, updateNota, clearCart, drawerOpen, setDrawerOpen } =
    useCartStore();
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + getPrecioFinal(item) * item.cantidad, 0);

  const handlePagar = () => {
    setDrawerOpen(false);
    router.push("/tienda/checkout");
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger className="relative inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-stone-100 hover:text-stone-900 h-10 w-10">
        <ShoppingCart className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-stone-500">Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 my-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between text-sm font-medium">
                        <h4 className="line-clamp-1">{item.nombre}</h4>
                        <p className="ml-4">
                          ${(getPrecioFinal(item) * item.cantidad).toLocaleString("es-CO")}
                        </p>
                      </div>
                      <p className="text-xs text-stone-500">
                        {item.descuentoPorcentaje > 0 ? (
                          <>
                            <span className="line-through mr-1">
                              ${item.precio.toLocaleString("es-CO")}
                            </span>
                            <span className="text-green-600 font-medium">
                              ${getPrecioFinal(item).toLocaleString("es-CO")}
                            </span>
                            c/u
                          </>
                        ) : (
                          `$${item.precio.toLocaleString("es-CO")} c/u`
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.cantidad - 1))
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.cantidad}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-8 w-8 text-stone-500 hover:text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Nota de personalización..."
                        className="mt-2 h-16 text-xs"
                        value={item.notaPersonalizacion || ""}
                        onChange={(e) => updateNota(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-auto">
              <Separator />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  ${total.toLocaleString("es-CO")}
                </span>
              </div>
              <SheetFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={clearCart}>
                  Vaciar carrito
                </Button>
                {sedeActual ? (
                <Button  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold py-1" onClick={handlePagar}>
                  Pagar
                </Button>
                ) : (
                  <Button className="flex-1" disabled>
                    Selecciona una sede
                  </Button>
                )}
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
