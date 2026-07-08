"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede, ConfiguracionTiendaDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Heart, Sparkles } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";

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

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";
  const tagline = config?.tagline || "Flores que cuentan historias";
  const descripcion = config?.descripcion || "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada para cada ocasión especial.";

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
            <img
              src={logoUrl}
              alt={sitioNombre}
              className="mx-auto mb-6 h-16 w-16 rounded-full"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-2">
              {sitioNombre}
            </h1>
            <p className="text-lg italic text-stone-500 mb-4">
              &ldquo;{tagline}&rdquo;
            </p>
            <p className="text-base text-stone-600 max-w-2xl mx-auto">
              {descripcion}
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
          <img
            src={logoUrl}
            alt={sitioNombre}
            className="mx-auto mb-6 h-16 w-16 rounded-full"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-2">
            {sitioNombre}
          </h1>
          <p className="text-lg italic text-stone-500 mb-4">
            &ldquo;{tagline}&rdquo;
          </p>
          <p className="text-base text-stone-600 max-w-2xl mx-auto">
            {descripcion}
          </p>
        </div>
      </section>

      {/* Banners SELECTOR_SEDE */}
      <BannerCarousel ubicacion="SELECTOR_SEDE" />

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

      {/* ── Nosotros: Misión + Visión ────────────────────────── */}
      <section className="border-t border-stone-200 bg-stone-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold text-stone-800">
              Sobre{" "}
              <span className="text-brand-mustard">{sitioNombre}</span>
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-stone-500">
              Creemos que cada flor tiene una historia por contar.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-mustard/10">
                <Heart className="size-6 text-brand-mustard" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-800">
                Nuestra Misión
              </h3>
              <p className="text-sm leading-relaxed text-stone-600">
                Transformar emociones en experiencias inolvidables mediante el
                diseño de arreglos florales exclusivos, elaborados con flores de
                la más alta calidad y una atención personalizada. Nos apasiona
                acompañar cada celebración, sorpresa y ocasión especial con
                creaciones que transmitan amor, gratitud, admiración y felicidad,
                superando las expectativas de nuestros clientes en cada entrega.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/30">
                <Sparkles className="size-6 text-brand-rose-dark" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-800">
                Nuestra Visión
              </h3>
              <p className="text-sm leading-relaxed text-stone-600">
                Consolidar a {sitioNombre} como una marca líder y referente
                en el diseño floral de alta calidad, reconocida por la excelencia
                de sus creaciones, la innovación y el servicio personalizado.
                Aspiramos a expandir nuestra presencia a nivel nacional e
                internacional, posicionándonos como una marca que inspira
                confianza, elegancia y emociones auténticas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
