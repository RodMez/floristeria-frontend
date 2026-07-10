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
import { AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import BannerCarousel from "@/components/banner/BannerCarousel";

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
        <h2 className="text-xl font-heading font-semibold text-stone-800 mb-6 text-center">
          Nuestras Sedes
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {sedes.map((sede) => (
            <Link key={sede.id} href={`/tienda/sede/${sede.id}`}>
              <Card className="group w-full max-w-xs overflow-hidden transition-shadow duration-300 hover:shadow-md cursor-pointer border-stone-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold text-stone-800">
                      {sede.nombre}
                    </h3>
                    <span className="text-stone-300">|</span>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <MapPin className="size-3 shrink-0 text-brand-sage" />
                      {sede.ciudad}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {sede.telefonoWhatsapp && (
                      <a
                        href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-600 transition-colors"
                      >
                        <FaWhatsapp className="size-3.5 shrink-0 text-emerald-500" />
                        {sede.telefonoWhatsapp}
                      </a>
                    )}
                    {sede.email && (
                      <a
                        href={`mailto:${sede.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition-colors"
                      >
                        <MdEmail className="size-3.5 shrink-0 text-amber-500" />
                        <span className="truncate max-w-[160px]">{sede.email}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {sede.instagramUrl && (
                      <a
                        href={sede.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center rounded-full p-1 text-stone-400 transition-colors hover:bg-brand-rose/30 hover:text-pink-500"
                        title="Instagram"
                      >
                        <FaInstagram className="size-3.5" />
                      </a>
                    )}
                    {sede.facebookUrl && (
                      <a
                        href={sede.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center rounded-full p-1 text-stone-400 transition-colors hover:bg-brand-sage/20 hover:text-blue-600"
                        title="Facebook"
                      >
                        <FaFacebook className="size-3.5" />
                      </a>
                    )}
                    {sede.tiktokUrl && (
                      <a
                        href={sede.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-700"
                        title="TikTok"
                      >
                        <FaTiktok className="size-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
