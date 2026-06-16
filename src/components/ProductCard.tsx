"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductoCatalogo, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useState, useMemo } from "react";
import Image from "next/image";

interface ProductCardProps {
  producto: ProductoCatalogo;
  sede: Sede;
}

export default function ProductCard({ producto, sede }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  // Mapear correctamente las categorías usando los IDs reales del backend
  // La API devuelve categoriasNombres (nombres), debemos mapearlos a IDs reales
  const categorias = useMemo(() => {
    // Si ya vienen con IDs (formato nuevo), usarlas directamente
    if (producto.categorias && producto.categorias.length > 0) {
      return producto.categorias;
    }
    // Fallback: mapear nombres a objetos con IDs reales
    if (producto.categoriasNombres && producto.categoriasNombres.length > 0) {
      // Nota: en ProductCard no tenemos acceso a la lista completa de categorías
      // Para mostrar badges usamos el nombre directamente sin ID (o ID temporal)
      return producto.categoriasNombres.map((n, i) => ({ id: i, nombre: n }));
    }
    // Fallback legacy
    if (producto.categoriaNombre) {
      return [{ id: 0, nombre: producto.categoriaNombre }];
    }
    return [];
  }, [producto.categorias, producto.categoriasNombres, producto.categoriaNombre]);

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
      <div className="aspect-square w-full overflow-hidden relative">
        <Image
          src={producto.imagenUrl}
          alt={producto.nombre}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
      </div>
      <CardContent className="p-4">
        {/* Categorías - Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {categorias.map((cat) => (
            <Badge key={cat.id} variant="secondary" className="text-xs">
              {cat.nombre}
            </Badge>
          ))}
        </div>

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