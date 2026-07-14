"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoCatalogo, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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

  const { data: catalogo } = useSWR<ProductoCatalogo[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sede.id}/complementos`,
    fetcher,
    { dedupingInterval: 60000 }
  );

  const complementos = (catalogo ?? [])
    .filter((p) => !excludeIds.has(String(p.productoId)) && p.disponible && p.stock > 0);

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
              className="w-[110px] flex-shrink-0 snap-start"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-stone-50 border border-stone-100 mb-1">
                <Image
                  src={comp.imagenUrl}
                  alt={comp.nombre}
                  fill
                  className="object-cover"
                  sizes="110px"
                />
              </div>
              <p className="text-[11px] font-medium text-stone-700 line-clamp-1 leading-tight">
                {comp.nombre}
              </p>
              <p className="text-[11px] font-bold text-[var(--color-brand-sage)] mt-0.5">
                +{formatPrecio(precio)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-6 w-full text-[10px] font-medium bg-brand-rose/15 text-stone-700 hover:bg-brand-rose/30 transition-all duration-200"
                onClick={() => {
                  addItem(
                    {
                      id: String(comp.productoId),
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
                }}
              >
                <ShoppingCart className="mr-0.5 h-2.5 w-2.5" />
                Agregar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
