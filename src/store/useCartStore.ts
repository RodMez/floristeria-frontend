import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sede } from "@/types";

export interface CartItem {
  id: string;
  nombre: string;
  sku?: string;
  precio: number;
  descuentoPorcentaje: number;
  cantidad: number;
  imagen_url: string;
  sede_id: string;
  notaPersonalizacion?: string;
}

export function getPrecioFinal(item: CartItem): number {
  const descuento = item.descuentoPorcentaje ?? 0;
  return item.precio - (item.precio * descuento) / 100;
}

interface CartState {
  items: CartItem[];
  sedeActual: Sede | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: CartItem, sede: Sede) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  updateNota: (id: string, nota: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      sedeActual: null,
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      addItem: (item, sede) =>
        set((state) => {
          // Si hay items en el carrito y la sede es diferente, vaciar el carrito
          if (state.items.length > 0 && state.sedeActual?.id !== sede.id) {
            console.warn(
              `Cambiando de sede: ${state.sedeActual?.nombre} -> ${sede.nombre}. Vaciando carrito.`
            );
            return {
              items: [item],
              sedeActual: sede,
            };
          }

          const existing = state.items.find((i) => String(i.id) === String(item.id));
          if (existing) {
            return {
              items: state.items.map((i) =>
                String(i.id) === String(item.id) ? { ...i, cantidad: i.cantidad + item.cantidad } : i
              ),
              sedeActual: sede,
            };
          }
          return { items: [...state.items, item], sedeActual: sede };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, cantidad) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
        })),
      updateNota: (id, nota) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, notaPersonalizacion: nota } : i)),
        })),
      clearCart: () => set({ items: [], sedeActual: null }),
    }),
    {
      name: "floristeria-cart-v2",
      partialize: (state) => ({
        items: state.items,
        sedeActual: state.sedeActual,
      }),
      merge: (persisted, current) => {
        const typedPersisted = persisted as Partial<CartState> | undefined;
        const rawItems = typedPersisted?.items ?? [];
        const seen = new Map<string, number>();
        const deduped = rawItems.filter((item) => {
          const key = String(item.id);
          const idx = seen.get(key) ?? 0;
          seen.set(key, idx + 1);
          return idx === 0;
        });
        return {
          ...current,
          ...typedPersisted,
          items: deduped,
        };
      },
    }
  )
);
