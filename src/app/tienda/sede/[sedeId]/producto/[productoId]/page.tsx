"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoDetalleDTO, Sede } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft, Minus, Plus, PackageX } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function formatPrecio(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

function ProductSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-5 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-48" />
          <Separator className="my-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-4 mt-8">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-14 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductoPage() {
  const params = useParams();
  const sedeId = params.sedeId as string;
  const productoId = params.productoId as string;

  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  const [cantidad, setCantidad] = useState(1);

  const { data: producto, isLoading, error } = useSWR<ProductoDetalleDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sedeId}/producto/${productoId}`,
    fetcher
  );

  const { data: sedes } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher
  );
  const sede = useMemo(
    () => sedes?.find((s) => s.id === Number(sedeId)) ?? null,
    [sedes, sedeId]
  );

  const tieneDescuento = (producto?.descuentoPorcentaje ?? 0) > 0;

  const isAgotado = producto ? !producto.disponible || producto.stock === 0 : false;

  const handleAddToCart = () => {
    if (!producto || !sede) return;

    addItem(
      {
        id: String(producto.productoId),
        nombre: producto.nombre,
        precio: producto.precioBase,
        descuentoPorcentaje: producto.descuentoPorcentaje ?? 0,
        cantidad,
        imagen_url: producto.imagenUrl,
        sede_id: String(sede.id),
      },
      sede
    );

    toast.success("¡Agregado al carrito!", {
      description: `${producto.nombre} x${cantidad}`,
      duration: 3000,
    });

    setDrawerOpen(true);
    setCantidad(1);
  };

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (error || !producto) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <PackageX className="mx-auto h-16 w-16 text-stone-300 mb-4" />
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          Producto no encontrado
        </h1>
        <p className="text-stone-500 mb-6">
          El producto que buscas no existe o no está disponible.
        </p>
        <Button variant="outline" render={<Link href={`/tienda/sede/${sedeId}`} />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb / Volver */}
      <Link
        href={`/tienda/sede/${sedeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Columna izquierda - Imagen */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg bg-stone-100">
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            fill
            priority
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {tieneDescuento && (
            <div className="discount-ribbon">
              <span>-{producto.descuentoPorcentaje}% OFF</span>
            </div>
          )}
        </div>

        {/* Columna derecha - Información */}
        <div className="flex flex-col">
          {/* Título */}
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            {producto.nombre}
          </h1>

          {/* SKU */}
          <p className="text-sm text-muted-foreground mb-4">
            SKU: {producto.sku}
          </p>

          {/* Precio */}
          <div className="flex items-center gap-3 mb-6">
            {tieneDescuento ? (
              <>
                <Badge variant="destructive" className="text-sm px-2.5 py-1">
                  -{producto.descuentoPorcentaje}% OFF
                </Badge>
                <span className="text-lg text-stone-400 line-through">
                  {formatPrecio(producto.precioBase)}
                </span>
                <span className="text-4xl font-extrabold text-primary">
                  {formatPrecio(producto.precioFinal)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-extrabold text-primary">
                {formatPrecio(producto.precioBase)}
              </span>
            )}
          </div>

          <Separator className="my-6" />

          {/* Descripción */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-2">
              Descripción
            </h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">
              {producto.descripcion}
            </p>
          </div>

          {/* Stock disponible */}
          {producto.stock > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              {producto.stock} unidades disponibles
            </p>
          )}

          {/* Selector de cantidad + Botón agregar */}
          {isAgotado ? (
            <div className="mt-auto">
              <Button disabled className="w-full h-14 text-base" size="lg">
                Producto Agotado
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-auto">
              {/* Selector cantidad */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-lg font-semibold tabular-nums">
                  {cantidad}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none"
                  onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                  disabled={cantidad >= producto.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Botón agregar al carrito */}
              <Button
                size="lg"
                className="flex-1 h-14 text-base font-semibold"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al Carrito
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
