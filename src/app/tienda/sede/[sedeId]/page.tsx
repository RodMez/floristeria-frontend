"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoCatalogo, CategoriaResponse, Sede } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, MapPin } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";

function SedeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-64 mb-2 bg-[var(--color-brand-rose)]" />
      <Skeleton className="h-5 w-96 mb-8 bg-[var(--color-brand-rose)]" />
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full bg-[var(--color-brand-rose)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg bg-[var(--color-brand-rose)]" />
            <Skeleton className="h-4 w-3/4 bg-[var(--color-brand-rose)]" />
            <Skeleton className="h-4 w-1/2 bg-[var(--color-brand-rose)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SedePage() {
  const params = useParams();
  const sedeId = params.sedeId as string;

  const {
    data: productos,
    isLoading: loadingProductos,
    error: errorProductos,
    mutate: mutateProductos,
  } = useSWR<ProductoCatalogo[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sedeId}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const {
    data: categorias,
    isLoading: loadingCategorias,
  } = useSWR<CategoriaResponse[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categorias`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const {
    data: sedes,
    isLoading: loadingSedes,
  } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const sede = sedes?.find((s) => s.id === Number(sedeId)) ?? null;
  const isLoading = loadingProductos || loadingCategorias || loadingSedes;

  if (isLoading) {
    return <SedeSkeleton />;
  }

  if (errorProductos) {
    return (
      <div className="container mx-auto px-4 py-16 text-center bg-[var(--color-brand-rose-light)]" role="alert" aria-live="polite">
        <AlertTriangle className="mx-auto h-12 w-12 text-[var(--color-brand-rose-dark)] mb-4" />
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          No se pudo cargar el catálogo
        </h2>
        <p className="text-stone-500 mb-6">
          Verifica tu conexión e intenta nuevamente.
        </p>
        <Button onClick={() => mutateProductos()} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!sede) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Sede no encontrada</h1>
        <p className="text-stone-600">La sede solicitada no existe.</p>
      </div>
    );
  }

  return (
    <>
      <BannerCarousel ubicacion="HOME_SEDE" sedeId={sede.id} maxHeight={640} />

      <div className="bg-[var(--color-brand-rose-light)]/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
            </div>
            <h1 className="text-3xl font-bold text-brand-mustard">{sede.nombre}</h1>
          </div>
          <p className="text-brand-sage mb-8">
            Explora nuestros productos disponibles en {sede.ciudad}
          </p>

        <ProductGrid
          productos={productos ?? []}
          categorias={categorias ?? []}
          sede={sede}
        />
      </div>
      </div>
    </>
  );
}
