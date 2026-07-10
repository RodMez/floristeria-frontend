"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO, Sede } from "@/types";
import { Heart, Sparkles, Target, ChevronRight, MapPin } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function NosotrosPage() {
  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const { data: sedes } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";
  const tagline = config?.tagline || "Flores que cuentan historias";
  const descripcion = config?.descripcion || "";
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

      {/* Descripción */}
      {descripcion && (
        <section className="py-12">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <p className="text-lg text-stone-600 leading-relaxed">{descripcion}</p>
          </div>
        </section>
      )}

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
          <h2 className="text-2xl font-semibold text-stone-800 mb-4">Contáctanos</h2>
          <p className="text-stone-500 mb-8 max-w-xl mx-auto">
            Estamos aquí para ayudarte. Ya sea que tengas una consulta, necesites un arreglo especial o quieras hacer un pedido, no dudes en comunicarte con nosotros.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto mb-8">
            {config?.correoMaestro && (
              <a href={`mailto:${config.correoMaestro}`} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 text-left text-sm font-medium text-stone-700 transition-colors hover:border-amber-300 hover:text-amber-600">
                <MdEmail className="size-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-stone-400">Email</p>
                  <p className="truncate">{config.correoMaestro}</p>
                </div>
              </a>
            )}
            {config?.whatsappGeneral && (
              <a href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 text-left text-sm font-medium text-stone-700 transition-colors hover:border-emerald-300 hover:text-emerald-600">
                <FaWhatsapp className="size-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs text-stone-400">WhatsApp</p>
                  <p>{config.whatsappGeneral}</p>
                </div>
              </a>
            )}
          </div>

          {/* Sedes */}
          {sedes && sedes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-heading font-semibold text-stone-400 uppercase tracking-wider mb-3">Nuestras Sedes</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {sedes.map((sede) => (
                  <div key={sede.id} className="w-full max-w-xs overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition-shadow duration-300 hover:shadow-md">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-sm font-semibold text-stone-800">
                          {sede.nombre}
                        </h4>
                        {sede.ciudad && (
                          <>
                            <span className="text-stone-300">|</span>
                            <div className="flex items-center gap-1 text-xs text-stone-400">
                              <MapPin className="size-3 shrink-0 text-brand-sage" />
                              {sede.ciudad}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {sede.telefonoWhatsapp && (
                          <a
                            href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-600 transition-colors"
                          >
                            <FaWhatsapp className="size-3.5 shrink-0 text-emerald-500" />
                            {sede.telefonoWhatsapp}
                          </a>
                        )}
                        {sede.email && (
                          <a
                            href={`mailto:${sede.email}`}
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
                            className="flex items-center justify-center rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-700"
                            title="TikTok"
                          >
                            <FaTiktok className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redes sociales */}
          <div className="flex flex-wrap justify-center gap-4">
            {config?.instagramUrl && (
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-pink-300 hover:text-pink-600">
                <FaInstagram className="size-4 text-pink-500" />
                Instagram
              </a>
            )}
            {config?.facebookUrl && (
              <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-blue-300 hover:text-blue-600">
                <FaFacebook className="size-4 text-blue-600" />
                Facebook
              </a>
            )}
            {config?.tiktokUrl && (
              <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900">
                <FaTiktok className="size-4" />
                TikTok
              </a>
            )}
          </div>

          <div className="mt-10">
            <Link href="/tienda" className="inline-flex items-center gap-1 text-brand-mustard hover:text-brand-mustard-dark font-medium transition-colors">
              Volver a la tienda <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}