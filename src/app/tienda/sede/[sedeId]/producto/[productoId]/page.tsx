"use client";

import { useParams, useRouter } from "next/navigation";
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
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  PackageX,
  Barcode,
  Package,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import BannerCarousel from "@/components/banner/BannerCarousel";
import { StarDisplay, ReseñasModal } from "@/components/reseñas";
import ComplementCard from "@/components/ComplementCard";

function formatPrecio(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

function ProductSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-5 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
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
          <Separator />
          <Skeleton className="aspect-square w-full max-w-sm rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductoPage() {
  const params = useParams();
  const router = useRouter();
  const sedeId = params.sedeId as string;
  const productoId = params.productoId as string;

  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const cartItems = useCartStore((s) => s.items);

  const [cantidad, setCantidad] = useState(1);
  const [reseñasModalOpen, setReseñasModalOpen] = useState(false);

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
  const cartItemIds = useMemo(
    () => new Set(cartItems.map((i) => i.id)),
    [cartItems]
  );

  const handleAddToCart = () => {
    if (!producto || !sede) return;

    addItem(
      {
        id: String(producto.productoId),
        nombre: producto.nombre,
        sku: producto.sku,
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

  const handleCategoryClick = (catNombre: string) => {
    router.push(`/tienda/sede/${sedeId}?categoria=${encodeURIComponent(catNombre)}`);
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href={`/tienda/sede/${sedeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      {/* Grid: 3/5 imagen + 2/5 info */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Columna izquierda: Imagen */}
        <div className="lg:col-span-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg bg-stone-100">
            <Image
              src={producto.imagenUrl}
              alt={producto.nombre}
              fill
              priority
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {tieneDescuento && (
              <div className="discount-ribbon">
                <span>-{producto.descuentoPorcentaje}% OFF</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Título */}
          <h1 className="text-3xl font-bold text-stone-800">
            {producto.nombre}
          </h1>

          {/* Categorías */}
          {producto.categoriasNombres && producto.categoriasNombres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {producto.categoriasNombres.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="inline-flex items-center rounded-full bg-[var(--color-brand-rose)]/20 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-[var(--color-brand-rose)]/40 cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Descripción */}
          <div>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">
              {producto.descripcion}
            </p>
          </div>

          {/* Estrellas y reseñas */}
          <button
            onClick={() => setReseñasModalOpen(true)}
            className="flex items-center gap-1.5 group cursor-pointer text-left"
          >
            <StarDisplay
              calificacion={Math.round(producto.ratingAverage ?? 0)}
              size="sm"
            />
            <span className="text-sm text-stone-500 group-hover:text-stone-700 transition-colors">
              {producto.ratingAverage
                ? `${producto.ratingAverage.toFixed(1)} estrellas (${producto.ratingCount} reseñas)`
                : "0 estrellas (0 reseñas)"}
            </span>
            <MessageSquare className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-600 transition-colors ml-0.5" />
          </button>

          {/* SKU */}
          <div className="flex items-center gap-1.5 text-sm text-stone-400">
            <Barcode className="h-3.5 w-3.5" />
            SKU: {producto.sku}
          </div>

          {/* Precio */}
          <div className="flex items-center gap-3">
            {tieneDescuento ? (
              <>
                <Badge variant="destructive" className="text-sm px-2.5 py-1">
                  -{producto.descuentoPorcentaje}% OFF
                </Badge>
                <span className="text-lg text-stone-400 line-through">
                  {formatPrecio(producto.precioBase)}
                </span>
                <span className="text-4xl font-extrabold text-[var(--color-brand-sage)]">
                  {formatPrecio(producto.precioFinal)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-extrabold text-stone-900">
                {formatPrecio(producto.precioBase)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-stone-400" />
            {isAgotado ? (
              <span className="text-sm font-medium text-red-500">Agotado</span>
            ) : producto.stock <= 5 ? (
              <span className="text-sm text-amber-600">
                ¡Últimas {producto.stock} unidades!
              </span>
            ) : (
              <span className="text-sm text-stone-500">
                {producto.stock} unidades disponibles
              </span>
            )}
          </div>

          <Separator />

          {/* Selector de cantidad + Botón */}
          {isAgotado ? (
            <Button disabled className="w-full h-14 text-base" size="lg">
              Producto Agotado
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
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

              <Button
                size="lg"
                className="flex-1 h-14 text-base font-semibold bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al Carrito
              </Button>
            </div>
          )}

          <Separator />

          {/* Banners promocionales */}
          <BannerCarousel
            ubicacion="PRODUCTO_INDIVIDUAL"
            sedeId={Number(sedeId)}
            aspectRatio="16/9"
          />
        </div>
      </div>

      {/* Complementos */}
      {producto.productosComplementarios && producto.productosComplementarios.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-[var(--color-brand-mustard)]" />
            <h2 className="text-xl font-semibold text-stone-800">
              Complementa tu pedido
            </h2>
            <span className="text-sm text-stone-400 font-normal">
              ({producto.productosComplementarios.length} adicionales)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {producto.productosComplementarios.map((comp) => {
              const compId = String(comp.productoId);
              const isInCart = cartItemIds.has(compId);
              return (
                <ComplementCard
                  key={comp.productoId}
                  producto={comp}
                  isInCart={isInCart}
                  onAdd={() => {
                    if (!sede) return;
                    addItem(
                      {
                        id: compId,
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
                    toast.success("¡Agregado al carrito!", {
                      description: comp.nombre,
                      duration: 2000,
                    });
                    setDrawerOpen(true);
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      <ReseñasModal
        open={reseñasModalOpen}
        onOpenChange={setReseñasModalOpen}
        productoId={producto.productoId}
        productoNombre={producto.nombre}
      />
    </div>
  );
}
