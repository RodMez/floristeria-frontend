"use client";

import { ProductoCatalogo } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import Image from "next/image";

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
  onAdd: () => void;
}

export default function ComplementCard({ producto, isInCart, onAdd }: ComplementCardProps) {
  const precioFinal = producto.descuentoPorcentaje
    ? producto.precio - (producto.precio * producto.descuentoPorcentaje) / 100
    : producto.precio;

  return (
    <div className="group flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
        <Image
          src={producto.imagenUrl}
          alt={producto.nombre}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="160px"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h4 className="text-sm font-medium text-stone-800 line-clamp-1 leading-tight">
          {producto.nombre}
        </h4>
        <p className="text-xs text-stone-400 line-clamp-1 leading-tight">
          {producto.descripcion}
        </p>
        <div className="mt-auto pt-1">
          <p className="text-sm font-bold text-stone-900">
            {formatPrecio(precioFinal)}
          </p>
          {producto.descuentoPorcentaje > 0 && (
            <p className="text-[11px] text-stone-400 line-through">
              {formatPrecio(producto.precio)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={isInCart ? "secondary" : "default"}
          className="mt-1 h-8 w-full text-xs font-medium"
          disabled={isInCart}
          onClick={onAdd}
        >
          {isInCart ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              En carrito
            </>
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
