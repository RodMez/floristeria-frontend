"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoCatalogo, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function formatPrecio(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

interface ComplementosSugeridosProps {
  sede: Sede;
  excludeIds: Set<string>;
  titulo?: string;
}

export default function ComplementosSugeridos({
  sede,
  excludeIds,
  titulo = "Complementa tu pedido",
}: ComplementosSugeridosProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const { data: catalogo } = useSWR<ProductoCatalogo[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sede.id}/complementos`,
    fetcher,
    { dedupingInterval: 60000 }
  );

  const seen = new Set<number>();
  const complementos = (catalogo ?? [])
    .filter((p) => {
      if (!p.disponible || p.stock <= 0) return false;
      if (excludeIds.has(String(p.productoId))) return false;
      if (seen.has(p.productoId)) return false;
      seen.add(p.productoId);
      return true;
    });

  if (complementos.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
        {titulo}
      </p>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1">
        {complementos.map((comp) => {
          const precio = comp.descuentoPorcentaje
            ? comp.precio - (comp.precio * comp.descuentoPorcentaje) / 100
            : comp.precio;

          return (
            <div
              key={comp.productoId}
              className="w-[110px] flex-shrink-0 snap-start group"
            >
              <Link href={`/tienda/sede/${sede.id}/producto/${comp.productoId}`} className="block">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-stone-50 border border-stone-100 mb-1">
                  <Image
                    src={comp.imagenUrl}
                    alt={comp.nombre}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="110px"
                  />
                  {comp.descuentoPorcentaje > 0 && (
                    <div className="absolute top-1 left-1 bg-brand-mustard text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
                      -{comp.descuentoPorcentaje}% OFF
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-medium text-stone-700 line-clamp-1 leading-tight group-hover:text-brand-mustard transition-colors duration-250">
                  {comp.nombre}
                </p>
              </Link>
              <div className="mt-0.5 min-h-[28px]">
                {comp.descuentoPorcentaje > 0 ? (
                  <>
                    <span className="text-[9px] font-normal text-stone-400 line-through block leading-tight">
                      +{formatPrecio(comp.precio)}
                    </span>
                    <span className="text-[11px] font-extrabold text-brand-mustard block leading-tight">
                      +{formatPrecio(precio)}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-[var(--color-brand-sage)] block leading-tight">
                    +{formatPrecio(precio)}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className={`mt-1 h-6 w-full text-[10px] font-extrabold transition-all duration-200 ${
                  addingItems.has(String(comp.productoId))
                    ? "bg-brand-mustard hover:bg-brand-mustard-dark text-stone-900!"
                    : "bg-brand-rose-dark hover:bg-brand-mustard text-white! hover:text-stone-900!"
                }`}
                onClick={() => {
                  const id = String(comp.productoId);
                  setAddingItems((prev) => new Set(prev).add(id));
                  addItem(
                    {
                      id,
                      nombre: comp.nombre,
                      sku: comp.sku,
                      precio: comp.precio,
                      descuentoPorcentaje: comp.descuentoPorcentaje ?? 0,
                      cantidad: 1,
                      imagen_url: comp.imagenUrl,
                      sede_id: String(sede.id),
                    },
                    sede
                  );
                  toast.success(`Agregado: ${comp.nombre}`, { duration: 2000 });
                  setDrawerOpen(true);
                  setTimeout(() => {
                    setAddingItems((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }, 1000);
                }}
              >
                <ShoppingCart className="mr-0.5 h-2.5 w-2.5" />
                {addingItems.has(String(comp.productoId)) ? "¡Agregado!" : "Agregar"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
