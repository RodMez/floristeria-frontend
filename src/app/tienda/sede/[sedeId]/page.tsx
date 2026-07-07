"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProductoCatalogo, CategoriaResponse, Sede } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";

function SedeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-64 mb-2" />
      <Skeleton className="h-5 w-96 mb-8" />
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
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
      <div className="container mx-auto px-4 py-16 text-center" role="alert" aria-live="polite">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          No se pudo cargar el catálogo
        </h2>
        <p className="text-stone-500 mb-6">
          Verifica tu conexión e intenta nuevamente.
        </p>
        <Button onClick={() => mutateProductos()}>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">{sede.nombre}</h1>
      <p className="text-stone-600 mb-8">
        Explora nuestros productos disponibles en {sede.ciudad}
      </p>

      <BannerCarousel ubicacion="HOME_SEDE" sedeId={sede.id} />

      <ProductGrid
        productos={productos ?? []}
        categorias={categorias ?? []}
        sede={sede}
      />
    </div>
  );
}
