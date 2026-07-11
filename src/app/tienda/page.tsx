"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";
import SedeCard from "@/components/SedeCard";

function SedesSkeleton() {
  return (
      <div className="min-h-screen">
      <section className="container mx-auto px-4 py-10">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full max-w-xs rounded-lg border border-stone-200 p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const {
    data: sedes,
    isLoading,
    error,
    mutate,
  } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (sedes && sedes.length === 1) {
      router.replace(`/tienda/sede/${sedes[0].id}`);
    }
  }, [sedes, router]);

  if (isLoading) {
    return <SedesSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100" role="alert" aria-live="polite">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">
            No se pudieron cargar las sedes
          </h2>
          <p className="text-stone-500 mb-6">
            Verifica tu conexión e intenta nuevamente.
          </p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!sedes || sedes.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="container mx-auto px-4 py-12">
          <p className="text-stone-500 text-center py-8">
            No hay sedes disponibles en este momento.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BannerCarousel ubicacion="SELECTOR_SEDE" maxHeight={640} />

      {/* Grid de Sedes */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-xl font-heading font-semibold text-brand-mustard mb-6 text-center">
          Nuestras Sedes
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {sedes.map((sede) => (
            <SedeCard key={sede.id} sede={sede} variant="navigable" />
          ))}
        </div>
      </section>
    </div>
  );
}
