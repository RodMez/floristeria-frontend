"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

function SedesSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[500px] mx-auto" />
        </div>
      </section>
      <section className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
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
      <div className="min-h-screen flex items-center justify-center" role="alert" aria-live="polite">
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
        <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
              Bienvenido a la Floristeria
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Encuentra los arreglos florales mas hermosos y frescos para cada ocasion.
            </p>
          </div>
        </section>
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
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            Bienvenido a la Floristeria
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Encuentra los arreglos florales mas hermosos y frescos para cada ocasion.
            Selecciona tu sede mas cercana para comenzar.
          </p>
        </div>
      </section>

      {/* Grid de Sedes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold text-stone-800 mb-8">
          Nuestras Sedes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sedes.map((sede) => (
            <Link key={sede.id} href={`/tienda/sede/${sede.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    {sede.nombre}
                  </h3>
                  <p className="text-stone-600 mb-1">{sede.ciudad}</p>
                  <p className="text-sm text-stone-500">{sede.telefonoWhatsapp}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
