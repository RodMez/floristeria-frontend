import { create } from "zustand";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_url: string;
  sede_id: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, cantidad: i.cantidad + item.cantidad } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  updateQuantity: (id, cantidad) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
    })),
  clearCart: () => set({ items: [] }),
}));
