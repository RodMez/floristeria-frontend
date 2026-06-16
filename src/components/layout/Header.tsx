"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "@/components/cart/CartDrawer";
import { useEffect, useState } from "react";

export default function Header() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  // Evitar hidratación mismatch con Zustand persist
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-semibold text-stone-800 hover:text-stone-600 transition-colors"
        >
          Floristería
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/tienda/auth"
            className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
          >
            Iniciar sesión
          </Link>
          <div className="relative">
            <CartDrawer />
            {isMounted && totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {totalItems}
              </Badge>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
