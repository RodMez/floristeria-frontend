"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, MapPin } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";
import SedeCard from "@/components/SedeCard";

function SedesSkeleton() {
  return (
      <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <section className="container mx-auto px-4 py-16">
        <Skeleton className="h-6 w-48 mb-6 bg-[var(--color-brand-rose)]" />
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full max-w-xs rounded-lg border border-[var(--color-brand-rose)]/30 p-4 space-y-2 bg-white">
              <Skeleton className="h-4 w-3/4 bg-[var(--color-brand-rose)]" />
              <Skeleton className="h-3 w-1/2 bg-[var(--color-brand-rose)]" />
              <Skeleton className="h-3 w-2/5 bg-[var(--color-brand-rose)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const hasRedirected = useRef(false);

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
    if (sedes && sedes.length === 1 && !hasRedirected.current) {
      hasRedirected.current = true;
      routerRef.current.replace(`/tienda/sede/${sedes[0].id}`);
    }
  }, [sedes]);

  if (isLoading) {
    return <SedesSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-rose-light)]" role="alert" aria-live="polite">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--color-brand-rose-dark)] mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">
            No se pudieron cargar las sedes
          </h2>
          <p className="text-stone-500 mb-6">
            Verifica tu conexión e intenta nuevamente.
          </p>
          <Button onClick={() => mutate()} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!sedes || sedes.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
        <section className="container mx-auto px-4 py-12">
          <p className="text-[var(--color-brand-rose-dark)] text-center py-8">
            No hay sedes disponibles en este momento.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <BannerCarousel ubicacion="SELECTOR_SEDE" maxHeight={640} />

      {/* Grid de Sedes */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-full bg-[var(--color-brand-mustard)]/15 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-[var(--color-brand-mustard-dark)]" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-brand-mustard">
            Nuestras Sedes
          </h2>
        </div>

        <div className="grid gap-4 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 320px))" }}>
          {sedes.map((sede) => (
            <SedeCard key={sede.id} sede={sede} variant="navigable" />
          ))}
        </div>
      </section>
    </div>
  );
}
