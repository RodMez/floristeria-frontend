"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarDisplay } from "@/components/reseñas";
import { ProductoCatalogo, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  producto: ProductoCatalogo;
  sede: Sede;
  priority?: boolean;
}

export default function ProductCard({ producto, sede, priority = false }: ProductCardProps) {
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
  const tieneDescuento = producto.descuentoPorcentaje > 0;
  const precioFinal = useMemo(
    () => producto.precio - (producto.precio * producto.descuentoPorcentaje) / 100,
    [producto.precio, producto.descuentoPorcentaje]
  );

  const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

  const precioOriginal = formatoPrecio.format(producto.precio);
  const precioConDescuento = formatoPrecio.format(precioFinal);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(
      {
        id: String(producto.productoId),
        nombre: producto.nombre,
        precio: producto.precio,
        descuentoPorcentaje: producto.descuentoPorcentaje,
        cantidad: 1,
        imagen_url: producto.imagenUrl,
        sede_id: String(sede.id),
      },
      sede
    );
    setTimeout(() => setIsAdding(false), 1000);
  };

  const productDetailHref = `/tienda/sede/${sede.id}/producto/${producto.productoId}`;

  return (
    <Card className="overflow-hidden h-full transition-shadow duration-200 hover:shadow-lg">
      <Link href={productDetailHref} className="group block cursor-pointer">
        <div className="aspect-square w-full overflow-hidden relative">
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          {tieneDescuento && (
            <div className="discount-ribbon">
              <span>-{producto.descuentoPorcentaje}% OFF</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-1">
          {/* Categorías - Badges */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[2rem] items-start">
            {categorias.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs">
                {cat.nombre}
              </Badge>
            ))}
          </div>

          <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-brand-mustard transition-colors duration-200">
            {producto.nombre}
          </h3>
          {producto.ratingAverage != null && producto.ratingAverage > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <StarDisplay calificacion={producto.ratingAverage} size="sm" />
              <span className="text-xs text-stone-400">({producto.ratingCount})</span>
            </div>
          )}
          <p className="text-sm text-stone-500 line-clamp-2 mt-1 min-h-[2.5rem] flex-1">
            {producto.descripcion}
          </p>
          <p className="text-lg font-semibold text-stone-900 mt-2">
            {tieneDescuento ? (
              <>
                <span className="text-sm font-normal text-stone-400 line-through mr-2">
                  {precioOriginal}
                </span>
                <span className="text-green-600">{precioConDescuento}</span>
              </>
            ) : (
              precioOriginal
            )}
          </p>
        </CardContent>
      </Link>
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