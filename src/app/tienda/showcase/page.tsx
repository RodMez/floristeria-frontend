"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoShowcase, ShowcaseVariante, ConfiguracionTiendaDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarDisplay } from "@/components/reseñas";
import ShowcaseBannerModal from "@/components/banner/ShowcaseBannerModal";
import {
  Sparkles,
  Flower2,
  MapPin,
  ShoppingCart,
  X,
  Gift,
  Heart,
  ArrowRight,
} from "lucide-react";

function formatPrecio(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ShowcasePage() {
  const router = useRouter();

  const { data, isLoading, error } = useSWR<ProductoShowcase[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/todas-las-sedes`,
    fetcher
  );

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductoShowcase | null>(null);

  const allCategories = useMemo(() => {
    if (!data) return [];
    const cats = new Set<string>();
    data.forEach((p) => p.categoriasNombres?.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    if (!selectedCategory) return data;
    return data.filter((p) =>
      p.categoriasNombres?.includes(selectedCategory)
    );
  }, [data, selectedCategory]);

  if (isLoading) {
    return <ShowcaseSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-rose-light)] flex items-center justify-center">
        <div className="text-center px-4">
          <Heart className="mx-auto h-16 w-16 text-stone-300 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            Explorando creaciones
          </h1>
          <p className="text-stone-500 mb-6">
            Estamos preparando algo especial. Vuelve pronto.
          </p>
          <Link href="/tienda" className="text-brand-mustard hover:text-brand-mustard-dark font-medium">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-brand-rose-light)] via-white to-[var(--color-brand-rose-light)]/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-brand-mustard">
            <Flower2 className="h-32 w-32 rotate-12" />
          </div>
          <div className="absolute bottom-20 right-20 text-brand-rose-dark">
            <Flower2 className="h-40 w-40 -rotate-12" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-mustard/20">
            <Flower2 className="h-64 w-64" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[var(--color-brand-mustard)]/10 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-brand-mustard" />
            <span className="text-sm font-medium text-[var(--color-brand-mustard-dark)]">
              {config?.showcaseBadge || "Todas nuestras sedes, un solo lugar"}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-stone-800 mb-4">
            Descubre la{" "}
              <span className="bg-gradient-to-r from-brand-mustard to-brand-rose-dark bg-clip-text text-transparent">
                {config?.showcaseTitulo || "Magia Floral"}
              </span>
          </h1>
          <p className="text-base md:text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
            {config?.showcaseSubtitulo ||
              "Explora cada creación, elige la sede más cercana y transforma cualquier momento en un recuerdo inolvidable."}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--color-brand-rose-light)]/30 to-transparent" />
      </section>

      {/* Banners Showcase Modal */}
      <ShowcaseBannerModal />

      {/* Category Filters */}
      <section className="container mx-auto px-4 mb-10">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === null
                ? "bg-brand-mustard text-white shadow-md"
                : "bg-white text-stone-600 hover:bg-[var(--color-brand-rose-light)] border border-stone-200"
            }`}
          >
            <Flower2 className="inline h-3.5 w-3.5 mr-1.5" />
            Todos
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-brand-mustard text-white shadow-md"
                  : "bg-white text-stone-600 hover:bg-[var(--color-brand-rose-light)] border border-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((producto) => (
            <ProductCard
              key={producto.productoId}
              producto={producto}
              onClick={() => setSelectedProduct(producto)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Gift className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-500">
              No hay productos en esta categoría aún.
            </p>
          </div>
        )}
      </section>

      {/* Sede Selection Modal */}
      {selectedProduct && (
        <SedeModal
          producto={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelectSede={(sedeId, productoId) =>
            router.push(`/tienda/sede/${sedeId}/producto/${productoId}`)
          }
        />
      )}
    </div>
  );
}

function ProductCard({
  producto,
  onClick,
}: {
  producto: ProductoShowcase;
  onClick: () => void;
}) {
  const tieneDescuento = producto.variantes.some((v) => v.descuentoPorcentaje > 0);
  const menorPrecio = Math.min(
    ...producto.variantes.map((v) => v.precioFinal)
  );
  const menorDescuento = Math.max(
    ...producto.variantes.map((v) => v.descuentoPorcentaje)
  );

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-white border border-stone-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
        <Image
          src={producto.imagenUrl}
          alt={producto.nombre}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {tieneDescuento && (
          <div className="absolute top-2 left-2 bg-brand-mustard text-white text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-md">
            Hasta -{menorDescuento}%
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-white/90 text-stone-600 text-xs shadow-sm backdrop-blur-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {producto.variantes.length} sede{producto.variantes.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <h3 className="font-semibold text-stone-800 text-sm md:text-base line-clamp-1 group-hover:text-brand-mustard transition-colors">
          {producto.nombre}
        </h3>

        <div className="flex items-center gap-1 mt-1 min-h-[1.25rem]">
          {producto.ratingAverage != null && producto.ratingAverage > 0 && (
            <>
              <StarDisplay calificacion={producto.ratingAverage} size="sm" />
              <span className="text-xs text-stone-400">({producto.ratingCount})</span>
            </>
          )}
        </div>

        <div className="mt-2">
          {tieneDescuento ? (
            <span className="text-sm font-extrabold text-brand-mustard">
              Desde {formatPrecio(menorPrecio)}
            </span>
          ) : (
            <span className="text-sm font-extrabold text-[var(--color-brand-sage)]">
              Desde {formatPrecio(menorPrecio)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SedeModal({
  producto,
  onClose,
  onSelectSede,
}: {
  producto: ProductoShowcase;
  onClose: () => void;
  onSelectSede: (sedeId: number, productoId: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
        >
          <X className="h-5 w-5 text-stone-500" />
        </button>

        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-t-2xl bg-stone-100">
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-10 relative z-10">
          <h2 className="text-xl font-bold text-stone-800 mb-1">
            {producto.nombre}
          </h2>
          <p className="text-sm text-stone-500 line-clamp-2 mb-4">
            {producto.descripcion}
          </p>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Disponible en {producto.variantes.length} sede{producto.variantes.length > 1 ? "s" : ""}
            </p>

            {producto.variantes.map((variante) => (
              <SedeOption
                key={variante.sedeId}
                variante={variante}
                onSelect={() => onSelectSede(variante.sedeId, producto.productoId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SedeOption({
  variante,
  onSelect,
}: {
  variante: ShowcaseVariante;
  onSelect: () => void;
}) {
  const tieneDescuento = variante.descuentoPorcentaje > 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border-2 border-stone-100 hover:border-brand-mustard/30 transition-colors p-4 group cursor-pointer" onClick={onSelect}>
      <div className="h-10 w-10 rounded-full bg-[var(--color-brand-rose-light)] flex items-center justify-center shrink-0">
        <MapPin className="h-5 w-5 text-[var(--color-brand-rose-dark)]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800">
          {variante.sedeNombre}
        </p>
        <p className="text-xs text-stone-400">{variante.ciudad}</p>
      </div>

      <div className="text-right shrink-0">
        {tieneDescuento ? (
          <>
            <p className="text-xs text-stone-400 line-through">
              {formatPrecio(variante.precio)}
            </p>
            <p className="text-sm font-extrabold text-brand-mustard">
              {formatPrecio(variante.precioFinal)}
            </p>
          </>
        ) : (
          <p className="text-sm font-extrabold text-[var(--color-brand-sage)]">
            {formatPrecio(variante.precioFinal)}
          </p>
        )}
      </div>

      <ArrowRight className="h-5 w-5 text-stone-300 group-hover:text-brand-mustard transition-colors shrink-0" />
    </div>
  );
}

function ShowcaseSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <div className="bg-gradient-to-b from-[var(--color-brand-rose-light)] to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto rounded-full mb-6" />
          <Skeleton className="h-14 w-3/4 mx-auto mb-4 rounded-lg" />
          <Skeleton className="h-6 w-96 mx-auto rounded-lg" />
        </div>
      </div>
      <div className="container mx-auto px-4 mb-10">
        <div className="flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-stone-100">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
