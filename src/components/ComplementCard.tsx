"use client";

import { ProductoCatalogo } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
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

interface ComplementCardProps {
  producto: ProductoCatalogo;
  isInCart: boolean;
  sedeId: string;
  onAdd: () => void;
}

export default function ComplementCard({ producto, isInCart, sedeId, onAdd }: ComplementCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const precioFinal = producto.descuentoPorcentaje
    ? producto.precio - (producto.precio * producto.descuentoPorcentaje) / 100
    : producto.precio;

  const handleAdd = () => {
    setIsAdding(true);
    onAdd();
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <div className="group flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <Link href={`/tienda/sede/${sedeId}/producto/${producto.productoId}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
          />
          {producto.descuentoPorcentaje > 0 && (
            <div className="absolute top-2 left-2 bg-brand-mustard text-white text-xs font-bold px-2.5 py-1 rounded z-10">
              -{producto.descuentoPorcentaje}% OFF
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h4 className="text-sm font-medium text-stone-800 line-clamp-1 leading-tight group-hover:text-brand-mustard transition-colors duration-250">
            {producto.nombre}
          </h4>
        </div>
      </Link>
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        <div className="mt-auto pt-1">
          <p className="text-sm font-bold text-stone-900">
            {producto.descuentoPorcentaje > 0 ? (
              <>
                <span className="text-[11px] font-normal text-stone-400 line-through mr-2">
                  {formatPrecio(producto.precio)}
                </span>
                <span className="text-brand-mustard font-extrabold">{formatPrecio(precioFinal)}</span>
              </>
            ) : (
              formatPrecio(precioFinal)
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant={isInCart ? "secondary" : "default"}
          className={`mt-1 h-8 w-full text-xs font-extrabold ${isInCart ? "" : isAdding ? "bg-brand-mustard hover:bg-brand-mustard-dark text-stone-900" : "bg-brand-rose-dark hover:bg-brand-mustard text-white hover:text-stone-900"}`}
          disabled={isInCart}
          onClick={handleAdd}
        >
          {isInCart ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              En carrito
            </>
          ) : isAdding ? (
            "¡Agregado!"
          ) : (
            <>
              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
              Agregar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
