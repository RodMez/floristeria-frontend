"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductoCatalogo, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useState } from "react";

interface ProductCardProps {
  producto: ProductoCatalogo;
  sede: Sede;
}

export default function ProductCard({ producto, sede }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  const isAgotado = !producto.disponible || producto.stock === 0;

  const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(producto.precio);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(
      {
        id: String(producto.productoId),
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        imagen_url: producto.imagenUrl,
        sede_id: String(sede.id),
      },
      sede
    );
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={producto.imagenUrl}
          alt={producto.nombre}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-stone-800 line-clamp-1">
          {producto.nombre}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 mt-1">
          {producto.descripcion}
        </p>
        <p className="text-lg font-semibold text-stone-900 mt-2">
          {formatoPrecio}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {isAgotado ? (
          <Badge variant="destructive">Agotado</Badge>
        ) : isAdding ? (
          <Button className="w-full bg-green-600 hover:bg-green-700">
            ¡Agregado!
          </Button>
        ) : (
          <Button className="w-full" onClick={handleAddToCart}>
            Agregar al Carrito
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
