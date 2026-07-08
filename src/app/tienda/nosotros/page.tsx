"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { Heart, Sparkles, Target, ChevronRight } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function NosotrosPage() {
  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";
  const tagline = config?.tagline || "Flores que cuentan historias";
  const historia = config?.historia || "";
  const mision = config?.mision || "";
  const vision = config?.vision || "";

  const sitiNombreParts = sitioNombre.split(" ");
  const nombreBase = sitiNombreParts[0];
  const nombreAcento = sitiNombreParts.slice(1).join(" ");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Image
            src={logoUrl}
            alt={sitioNombre}
            width={80}
            height={80}
            className="mx-auto mb-6 rounded-full"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-2">
            {nombreBase}{nombreAcento && <span className="text-brand-mustard"> {nombreAcento}</span>}
          </h1>
          <p className="text-lg italic text-stone-500">&ldquo;{tagline}&rdquo;</p>
        </div>
      </section>

      {/* Historia */}
      {historia && (
        <section className="py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-semibold text-stone-800 mb-6 flex items-center gap-2">
              <Heart className="size-6 text-brand-rose-dark" />
              Nuestra Historia
            </h2>
            {historia.split("\n\n").map((p: string, i: number) => (
              <p key={i} className="text-stone-600 leading-relaxed mb-4">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* Misión + Visión */}
      {(mision || vision) && (
        <section className="bg-stone-50 border-t border-stone-200 py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid gap-8 md:grid-cols-2">
              {mision && (
                <div className="rounded-xl border border-stone-200 bg-white p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-mustard/10">
                    <Target className="size-6 text-brand-mustard" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-stone-800">Misión</h3>
                  <p className="text-sm leading-relaxed text-stone-600">{mision}</p>
                </div>
              )}
              {vision && (
                <div className="rounded-xl border border-stone-200 bg-white p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/30">
                    <Sparkles className="size-6 text-brand-rose-dark" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-stone-800">Visión</h3>
                  <p className="text-sm leading-relaxed text-stone-600">{vision}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contacto */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-semibold text-stone-800 mb-8">Contáctanos</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {config?.whatsappGeneral && (
              <a href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-emerald-300 hover:text-emerald-600">
                <FaWhatsapp className="size-5 text-emerald-500" />
                WhatsApp
              </a>
            )}
            {config?.instagramUrl && (
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-pink-300 hover:text-pink-600">
                <FaInstagram className="size-5 text-pink-500" />
                Instagram
              </a>
            )}
            {config?.facebookUrl && (
              <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-blue-300 hover:text-blue-600">
                <FaFacebook className="size-5 text-blue-600" />
                Facebook
              </a>
            )}
            {config?.tiktokUrl && (
              <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900">
                <FaTiktok className="size-5" />
                TikTok
              </a>
            )}
            {config?.correoMaestro && (
              <a href={`mailto:${config.correoMaestro}`} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-amber-300 hover:text-amber-600">
                <MdEmail className="size-5 text-amber-500" />
                Email
              </a>
            )}
          </div>
          <div className="mt-8">
            <Link href="/tienda" className="inline-flex items-center gap-1 text-brand-mustard hover:text-brand-mustard-dark font-medium transition-colors">
              Volver a la tienda <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}