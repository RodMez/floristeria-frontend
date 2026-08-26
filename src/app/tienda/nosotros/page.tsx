"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { fetcher } from "@/lib/fetcher";
import { useSedes } from "@/hooks/useSedes";
import { ConfiguracionTiendaDTO } from "@/types";
import {
  Heart,
  Sparkles,
  Target,
  ChevronRight,
  Flower2,
  Palette,
  HandHeart,
  Quote,
  Leaf,
  ArrowRight,
  ArrowUpRight,
  Mail,
  Phone,
  Truck,
  QuoteIcon,
  MapPin,
} from "lucide-react";
import SedeCard from "@/components/SedeCard";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaTiktok,
} from "@/components/icons/SocialIcons";
import { sanitizeUrl } from "@/lib/validation";
import { useEffect } from "react";

// ── reveal hook ── observa también nodos inyectados tras fetch (has* cambia)
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const observeAll = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => {
        // evita observar dos veces el mismo
        if ((el as unknown as { __ioObserved?: boolean }).__ioObserved) return;
        (el as unknown as { __ioObserved?: boolean }).__ioObserved = true;
        // si ya está en viewport, marcar visible sin esperar (evita quedarse oculto si se inyecta ya visible)
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight - 60 && rect.bottom > 0;
        if (inView && rect.top < window.innerHeight * 0.92) {
          // pequeña defer para animación
          requestAnimationFrame(() => el.classList.add("is-visible"));
          return;
        }
        io.observe(el);
      });
    };

    observeAll();
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    // fallback: re-observa tras cualquier render tardío (SWR)
    const t = setTimeout(observeAll, 400);

    return () => {
      clearTimeout(t);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

function SectionLabel({
  icon: Icon,
  children,
  kicker,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  kicker?: string;
}) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      {kicker && (
        <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
          {kicker}
        </span>
      )}
      <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Icon className="size-3.5 text-brand-mustard" />
        <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-stone-600">
          {children}
        </span>
      </div>
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function NosotrosPage() {
  useReveal();

  const { data: config, isLoading: configLoading } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );
  const { sedes, isLoading: sedesLoading } = useSedes();

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";
  const tagline = config?.tagline || "Flores que cuentan historias";
  const descripcion = config?.descripcion?.trim() || "";
  const historia = config?.historia?.trim() || "";
  const historiaImagenUrl = config?.historiaImagenUrl?.trim() || "";
  const mision = config?.mision?.trim() || "";
  const vision = config?.vision?.trim() || "";

  const hasDescripcion = descripcion.length > 0;
  const hasHistoria = historia.length > 0;
  const hasHistoriaImagen = historiaImagenUrl.length > 0;
  const hasHistoriaSection = hasHistoria || hasHistoriaImagen;
  const hasMisionVision = !!(mision || vision);

  // DB guarda solo "Boutique Floral" — el logo TAO es la primera palabra visual
  const nombreSinTao = sitioNombre.replace(/^tao\s+/i, "").trim() || sitioNombre;
  const nameParts = nombreSinTao.split(/\s+/).filter(Boolean);
  const nombreBase = nameParts[0] ?? nombreSinTao;
  const nombreAcento = nameParts.slice(1).join(" ");
  const boutiquePart = nombreSinTao; // para lockup TAO + boutiquePart = nombre completo

  const historiaParagraphs = hasHistoria
    ? historia
        .split(/\n\s*\n/)
        .flatMap((block) =>
          block
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        )
    : [];
  const descripcionParagraphs = hasDescripcion
    ? descripcion
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const sedesCount = sedes?.length ?? 0;
  const isSingleSede = sedesCount <= 1;
  const showSedesTitle = sedesCount >= 2;

  return (
    <div className="min-h-screen bg-[#fffbf8] text-stone-800 selection:bg-brand-mustard/30">
      <style>{`
        html{scroll-behavior:smooth}
        [data-reveal]{opacity:0;transform:translateY(14px);transition:opacity .52s cubic-bezier(.16,1,.3,1),transform .52s cubic-bezier(.16,1,.3,1);will-change:transform,opacity}
        [data-reveal].is-visible{opacity:1;transform:translateY(0)}
        @media (prefers-reduced-motion:reduce){
          [data-reveal]{opacity:1;transform:none;transition:none;will-change:auto}
          html{scroll-behavior:auto}
        }
        .text-balance{ text-wrap:balance }
        .dropcap:first-letter{
          float:left;
          font-family:var(--font-cinzel);
          font-size:3.1rem;
          line-height:0.85;
          font-weight:700;
          padding-right:10px;
          margin-top:6px;
          color:#E5BE6F;
        }
      `}</style>

      {/* ── HERO · editorial split ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-stone-200/60 bg-[#fffaf6]">
        {/* washes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f1e5e2] via-[#fff5f1] to-[#fffbf8]" />
          <div className="absolute -top-32 -left-24 h-[620px] w-[620px] rounded-full bg-[#EAC3BD]/22 blur-[90px]" />
          <div className="absolute -top-28 right-[-80px] h-[540px] w-[540px] rounded-full bg-[#E5BE6F]/14 blur-[84px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        </div>
        <GrainOverlay />

        {/* top editorial bar */}
        <div className="relative border-b border-stone-200/70 bg-white/55 backdrop-blur-[6px]">
          <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 text-[10px] tracking-[0.18em] uppercase text-stone-400">
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="h-px w-6 bg-stone-300" /> Artesanía floral · Colombia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Pide hoy · entrega a tiempo
            </span>
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <span className="relative block size-4 overflow-hidden rounded-full border border-stone-200 bg-white">
                <Image src={logoUrl} alt="TAO" fill className="object-contain p-0.5" sizes="16px" />
              </span>
              TAO {boutiquePart}
            </span>
          </div>
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
            {/* left: manifesto */}
            <div className="min-w-0">
              <div
                data-reveal
                className="is-visible inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm"
                style={{ transitionDelay: "40ms" }}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-mustard text-white">
                  <Leaf className="size-3" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-stone-600">
                  Nuestra Casa
                </span>
              </div>

              {/* Lockup: logo TAO siempre a la izquierda/arriba del nombre */}
              {configLoading ? (
                <div className="mt-6 flex items-center gap-4">
                  <div className="size-16 animate-pulse rounded-2xl bg-stone-200 md:size-20" />
                  <div className="space-y-3">
                    <div className="h-8 w-44 animate-pulse rounded-lg bg-stone-200 md:h-9 md:w-56" />
                    <div className="h-8 w-36 animate-pulse rounded-lg bg-stone-200 md:h-9 md:w-44" />
                  </div>
                </div>
              ) : (
                <div
                  data-reveal
                  className="is-visible mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4"
                  style={{ transitionDelay: "110ms" }}
                >
                  <div className="shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                    <div className="relative size-16 md:size-20">
                      <Image src={logoUrl} alt="TAO" fill className="object-contain" sizes="80px" priority />
                    </div>
                  </div>
                  <h1 className="font-heading text-[2.45rem] font-semibold leading-[0.88] tracking-[-0.03em] text-[#1c1917] md:text-[3.05rem] lg:text-[3.55rem] text-balance">
                    <span className="block">{nombreBase}</span>
                    {nombreAcento && (
                      <span className="block font-light italic tracking-[-0.04em] text-brand-mustard">
                        {nombreAcento}
                      </span>
                    )}
                  </h1>
                </div>
              )}

              {configLoading ? (
                <div className="mt-4 h-4 w-56 animate-pulse rounded-full bg-stone-200" />
              ) : (
                <p
                  data-reveal
                  className="is-visible mt-4 flex items-center gap-3 text-[13px] font-medium tracking-[0.14em] uppercase text-stone-400"
                  style={{ transitionDelay: "170ms" }}
                >
                  <span className="h-px w-8 bg-brand-mustard/40" />
                  &ldquo;{tagline}&rdquo;
                </p>
              )}

              <p
                data-reveal
                className="is-visible mt-6 max-w-[560px] text-[15.5px] leading-7 text-stone-600"
                style={{ transitionDelay: "210ms" }}
              >
                {hasDescripcion ? (
                  descripcionParagraphs[0]?.slice(0, 220) +
                  (descripcionParagraphs[0] && descripcionParagraphs[0].length > 220 ? "…" : "")
                ) : (
                  <>
                    No vendemos solo flores. Componemos gestos: textura, color y perfume para decir lo que
                    a veces no cabe en palabras. Cada arreglo nace a mano, sin prisa y con detalle.
                  </>
                )}
              </p>

              <div
                data-reveal
                className="is-visible mt-7 flex flex-wrap gap-3"
                style={{ transitionDelay: "260ms" }}
              >
                <a
                  href="#historia"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#1c1917] px-6 py-3.5 text-sm font-medium text-white shadow-[0_12px_32px_-14px_rgba(28,25,23,0.45)] transition hover:bg-black hover:shadow-[0_16px_36px_-14px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2"
                >
                  Nuestra historia
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#1c1917] transition group-hover:translate-x-0.5">
                    <ArrowRight className="size-3.5" />
                  </span>
                </a>
                <Link
                  href="/tienda"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-brand-mustard/40 hover:text-[#1c1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2"
                >
                  Ver catálogo <ArrowUpRight className="size-4 opacity-60" />
                </Link>
              </div>

              {/* trust row */}
              <div
                data-reveal
                className="is-visible mt-8 grid grid-cols-3 gap-2 border-t border-stone-200/70 pt-6 sm:gap-3"
                style={{ transitionDelay: "310ms" }}
              >
                {[
                  { k: "Frescura", v: "Mismo día", icon: Flower2 },
                  { k: "Entrega", v: "Puntual", icon: Truck },
                  { k: "Asesoría", v: "Humana", icon: HandHeart },
                ].map((s) => (
                  <div key={s.k} className="flex items-center gap-2.5">
                    <span className="hidden size-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 sm:flex">
                      <s.icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-400">
                        {s.k}
                      </span>
                      <span className="block text-sm font-medium text-stone-700">{s.v}</span>
                    </span>
                  </div>
                ))}
              </div>
              {/* prueba social: Sabaneta · envíos */}
              <div
                data-reveal
                className="is-visible mt-3 flex flex-wrap gap-2"
                style={{ transitionDelay: "360ms" }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
                  <MapPin className="size-3.5 text-brand-sage" /> Sabaneta · Antioquia
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
                  <Truck className="size-3.5 text-emerald-600" /> Envíos hoy · puntuales
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-500">
                  <Heart className="size-3 text-rose-400" /> Hecho a mano
                </span>
              </div>
            </div>

            {/* right: brand showcase — solo logo, limpio */}
            <div data-reveal className="is-visible relative lg:pl-2" style={{ transitionDelay: "140ms" }}>
              <div className="relative mx-auto max-w-[460px]">
                <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.2deg] rounded-[32px] border border-stone-200 bg-white shadow-sm" />
                <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[0.6deg] rounded-[32px] border border-stone-200 bg-[#fffdfb]" />

                {/* front — solo logo */}
                <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white p-3 shadow-[0_24px_64px_-20px_rgba(28,25,23,0.18)]">
                  <div className="relative aspect-[4/3.4] overflow-hidden rounded-[24px] border border-stone-100 bg-[#fffbf8]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fffdf8] via-white to-[#f8ede5]" />
                    <GrainOverlay />
                    <div className="absolute inset-0 flex items-center justify-center p-8 md:p-10">
                      <div className="relative h-full w-full">
                        <Image
                          src={logoUrl}
                          alt={`Logo TAO ${boutiquePart}`}
                          fill
                          className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                          sizes="(max-width: 768px) 320px, 420px"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* marquee — decorativo, oculto para lectores */}
        <div className="relative overflow-hidden border-y border-stone-200 bg-white" aria-hidden="true">
          <div className="flex animate-[marquee_22s_linear_infinite] whitespace-nowrap py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-stone-400">
            <span className="mx-6">Flores que cuentan historias</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Diseño con alma</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Frescura del día</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Hecho a mano</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Cercanía real</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Flores que cuentan historias</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Diseño con alma</span>
            <span className="text-stone-300">•</span>
            <span className="mx-6">Frescura del día</span>
            <span className="text-stone-300">•</span>
          </div>
          <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>
      </section>

      {/* ── MANIFIESTO / ESENCIA ───────────────────────────────────── */}
      {configLoading && (
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.15fr] lg:gap-10">
              <div className="space-y-3">
                <div className="h-6 w-32 animate-pulse rounded-full bg-stone-200" />
                <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
                <div className="h-4 w-80 animate-pulse rounded bg-stone-100" />
              </div>
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 md:p-8">
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-stone-100" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-stone-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {hasDescripcion && (
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#fff1e6_0%,_transparent_62%)] opacity-60" />
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.15fr] lg:gap-10">
              {/* left label */}
              <div data-reveal className="lg:sticky lg:top-24 self-start">
                <SectionLabel icon={Sparkles} kicker="Manifiesto">
                  Nuestra esencia
                </SectionLabel>
                <h2 className="mt-5 font-heading text-[2rem] font-semibold leading-[0.95] tracking-[-0.02em] text-[#1c1917] md:text-[2.35rem] text-balance">
                  No hacemos ramos.
                  <span className="block font-light italic text-stone-500">Traducimos emociones.</span>
                </h2>
                <p className="mt-3 max-w-[420px] text-sm leading-6 text-stone-500">
                  Textura, color y perfume para decir gracias, perdón, te amo o estoy aquí — sin decirlo todo
                  con palabras.
                </p>
                <div className="mt-6 hidden items-center gap-2.5 lg:flex">
                  <span className="h-px w-10 bg-stone-200" />
                  <span className="relative block size-6 overflow-hidden rounded-full border border-stone-200 bg-white">
                    <Image src={logoUrl} alt="TAO" fill className="object-contain p-0.5" sizes="24px" />
                  </span>
                  <span className="text-xs tracking-[0.14em] uppercase text-stone-400">TAO {boutiquePart}</span>
                </div>
              </div>

              {/* right card */}
              <div
                data-reveal
                className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.14)] md:p-8"
              >
                <GrainOverlay />
                <Quote className="absolute -right-2 -top-2 size-24 text-stone-100" />
                <div className="relative">
                  <div className="mb-5 inline-flex items-center gap-2 text-brand-mustard">
                    <Quote className="size-5" />
                    <span className="h-px w-10 bg-brand-mustard/30" />
                    <span className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-400">
                      En nuestras palabras
                    </span>
                  </div>
                  <div className="space-y-5">
                    {descripcionParagraphs.map((p, i) => (
                      <p
                        key={i}
                        data-reveal
                        style={{ transitionDelay: `${i * 70}ms` }}
                        className="text-[15px] leading-7 text-stone-600"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2 border-t border-stone-100 pt-6">
                    {[
                      { icon: Leaf, label: "Selección diaria" },
                      { icon: Palette, label: "Diseño único" },
                      { icon: HandHeart, label: "Trato cercano" },
                    ].map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600"
                      >
                        <b.icon className="size-3.5 text-stone-400" /> {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* divider */}
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-4 py-2">
          <span className="h-px w-16 bg-stone-200" />
          <span className="flex size-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400">
            <Heart className="size-3.5" />
          </span>
          <span className="h-px w-16 bg-stone-200" />
        </div>
      </div>

      {/* ── HISTORIA ───────────────────────────────────────────────── */}
      {configLoading && (
        <section className="relative overflow-hidden py-10 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <div className="mx-auto h-6 w-36 animate-pulse rounded-full bg-stone-200" />
              <div className="mx-auto h-8 w-80 animate-pulse rounded-lg bg-stone-200" />
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div className="aspect-[4/3] animate-pulse rounded-[28px] bg-stone-100" />
              <div className="space-y-3 rounded-[28px] border border-stone-200 bg-white p-7">
                <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          </div>
        </section>
      )}
      {hasHistoriaSection && (
        <section id="historia" className="relative scroll-mt-24 overflow-hidden py-10 md:py-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f1e5e2]/55 blur-[74px]" />
          <div className="container mx-auto max-w-6xl px-4">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <SectionLabel icon={Heart}>Nuestra historia</SectionLabel>
              <h2 className="mt-4 font-heading text-[1.9rem] font-semibold leading-[0.95] tracking-[-0.02em] text-[#1c1917] md:text-[2.4rem] text-balance">
                El arte de transformar flores en recuerdos
              </h2>
              <div className="mx-auto mt-4 h-px w-12 bg-brand-mustard/40" />
            </div>

            <div className="mt-10">
              {hasHistoria && hasHistoriaImagen ? (
                <div className="grid items-start gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
                  {/* image */}
                  <div data-reveal className="group relative lg:sticky lg:top-24">
                    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white p-2 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.16)]">
                      <div className="overflow-hidden rounded-[20px] bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={historiaImagenUrl}
                          alt="Arreglo floral artesanal — historia de TAO Boutique Floral"
                          className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 left-4 hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600 shadow-md md:inline-flex">
                      <span className="flex size-6 items-center justify-center rounded-full bg-brand-sage/10 text-brand-sage">
                        <Leaf className="size-3.5" />
                      </span>
                      Hecho a mano, con amor
                    </div>
                    {/* tape effect */}
                    <div className="absolute -right-1 -top-1 hidden h-6 w-16 rotate-[8deg] rounded-sm bg-brand-mustard/18 shadow-sm md:block" />
                  </div>

                  {/* text */}
                  <div
                    data-reveal
                    className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_-28px_rgba(0,0,0,0.10)]"
                  >
                    <GrainOverlay />
                    <div className="relative p-7 md:p-8">
                      <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-5">
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#1c1917] text-white">
                          <QuoteIcon className="size-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-400">
                            Historia
                          </p>
                          <p className="font-heading text-sm font-semibold text-stone-700">Contada sin prisa</p>
                        </div>
                        <span className="ml-auto hidden text-xs text-stone-400 md:inline">
                          {historiaParagraphs.length} fragmentos
                        </span>
                      </div>

                      <div className="space-y-5">
                        {historiaParagraphs.map((para, idx) => (
                          <p
                            key={idx}
                            data-reveal
                            style={{ transitionDelay: `${idx * 60}ms` }}
                            className={`text-[15px] leading-7 text-stone-600 ${idx === 0 ? "dropcap" : ""}`}
                          >
                            {para}
                          </p>
                        ))}
                      </div>

                      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-stone-100 pt-6">
                        {[
                          { v: "Flores frescas", k: "Selección diaria" },
                          { v: "Piezas únicas", k: "Diseño irrepetible" },
                          { v: "Atención cercana", k: "Asesoría humana" },
                        ].map((s) => (
                          <div key={s.v} className="rounded-2xl border border-stone-100 bg-stone-50 px-3 py-3 text-center">
                            <div className="font-heading text-sm font-semibold text-stone-700">{s.v}</div>
                            <div className="text-[11px] tracking-wide text-stone-400">{s.k}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : hasHistoria ? (
                <div
                  data-reveal
                  className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)]"
                >
                  <GrainOverlay />
                  <div className="relative p-7 md:p-10">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#1c1917] text-white">
                        <QuoteIcon className="size-4" />
                      </span>
                      <span className="text-xs font-semibold tracking-[0.16em] uppercase text-stone-400">
                        Nuestra Historia
                      </span>
                      <span className="h-px flex-1 bg-stone-100" />
                    </div>
                    <div className="space-y-5">
                      {historiaParagraphs.map((para, idx) => (
                        <p
                          key={idx}
                          data-reveal
                          style={{ transitionDelay: `${idx * 60}ms` }}
                          className={`text-[15px] leading-7 text-stone-600 ${idx === 0 ? "dropcap" : ""}`}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div data-reveal className="mx-auto max-w-2xl">
                  <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white p-2 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.16)]">
                    <div className="overflow-hidden rounded-[20px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={historiaImagenUrl}
                        alt="Arreglo floral artesanal — historia de TAO Boutique Floral"
                        className="h-auto w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── MISIÓN / VISIÓN · editorial spread ─────────────────────── */}
      {configLoading && (
        <section className="relative overflow-hidden border-y border-stone-200 bg-[#fdf6f0] py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-stone-200" />
              <div className="mx-auto h-6 w-64 animate-pulse rounded-full bg-stone-100" />
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-[28px] bg-white" />
              <div className="h-44 animate-pulse rounded-[28px] bg-white" />
            </div>
          </div>
        </section>
      )}
      {hasMisionVision && (
        <section className="relative overflow-hidden border-y border-stone-200 bg-[#fdf6f0] py-12 md:py-16">
          <GrainOverlay />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_white,_transparent_60%)]" />
          <div className="container mx-auto max-w-6xl px-4">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <SectionLabel icon={Target} kicker="Propósito">
                Lo que nos mueve
              </SectionLabel>
              {/* fila estilo marquee/pills — misma estética que Hecho a mano • Cercanía real • ... */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-stone-600 shadow-sm">
                  <span className="size-1.5 rounded-full bg-brand-mustard" /> Claridad
                </span>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-stone-600 shadow-sm">
                  <span className="size-1.5 rounded-full bg-brand-rose-dark" /> Calma
                </span>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-stone-600 shadow-sm">
                  <span className="size-1.5 rounded-full bg-brand-sage" /> Oficio
                </span>
              </div>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-500">
                Dos ideas simples que guían cada tallo que tocamos y cada entrega que cuidamos.
              </p>
            </div>

            <div className={`mt-10 grid gap-6 ${mision && vision ? "md:grid-cols-2" : "mx-auto max-w-2xl grid-cols-1"}`}>
              {mision && (
                <div
                  data-reveal
                  className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] md:p-8"
                >
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-mustard/10 blur-2xl transition group-hover:bg-brand-mustard/14" />
                  <div className="relative flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                      <Target className="size-6" />
                    </span>
                    <span className="font-heading text-5xl font-light leading-none text-stone-100">01</span>
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-semibold tracking-tight text-[#1c1917]">Misión</h3>
                  <p className="mt-2 text-[15px] leading-7 text-stone-600">{mision}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-stone-400">
                    <span className="h-px w-8 bg-stone-200" /> Oficio diario
                  </div>
                </div>
              )}
              {vision && (
                <div
                  data-reveal
                  style={{ transitionDelay: "110ms" }}
                  className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] md:p-8"
                >
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-rose/18 blur-2xl transition group-hover:bg-brand-rose/24" />
                  <div className="relative flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-brand-rose-dark">
                      <Sparkles className="size-6" />
                    </span>
                    <span className="font-heading text-5xl font-light leading-none text-stone-100">02</span>
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-semibold tracking-tight text-[#1c1917]">Visión</h3>
                  <p className="mt-2 text-[15px] leading-7 text-stone-600">{vision}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-stone-400">
                    <span className="h-px w-8 bg-stone-200" /> Largo plazo
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── VALORES ────────────────────────────────────────────────── */}
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div data-reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel icon={Flower2} kicker="Pilares">
                Nuestros pilares
              </SectionLabel>
              <h2 className="mt-4 font-heading text-[1.9rem] font-semibold leading-[0.95] tracking-[-0.02em] text-[#1c1917] md:text-[2.3rem] text-balance">
                Detalles que se sienten,
                <span className="block font-light italic text-stone-500">aunque no se digan.</span>
              </h2>
            </div>
            <p data-reveal className="max-w-[420px] text-sm leading-6 text-stone-600">
              Cada entrega lleva un compromiso silencioso: flores vivas, diseño honesto y cercanía sin
              condiciones.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Flower2,
                title: "Frescura que perdura",
                desc: "Selección del día, tallo a tallo. Flores que llegan vibrantes y se mantienen hermosas por más tiempo.",
                accent: "bg-emerald-50 border-emerald-200 text-emerald-700",
                dot: "bg-emerald-500",
              },
              {
                n: "02",
                icon: Palette,
                title: "Diseño con alma",
                desc: "Cada arreglo es una composición única, pensada para la persona y el momento que celebra.",
                accent: "bg-amber-50 border-amber-200 text-amber-700",
                dot: "bg-amber-500",
              },
              {
                n: "03",
                icon: HandHeart,
                title: "Cercanía real",
                desc: "Asesoría humana, respuesta rápida y entregas puntuales en cada sede. Sin letras pequeñas.",
                accent: "bg-rose-50 border-rose-200 text-rose-700",
                dot: "bg-rose-400",
              },
            ].map((v, i) => (
              <div
                key={v.title}
                data-reveal
                style={{ transitionDelay: `${i * 90}ms` }}
                className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_10px_32px_-18px_rgba(0,0,0,0.12)] transition hover:-translate-y-1 hover:shadow-[0_20px_48px_-18px_rgba(0,0,0,0.14)] md:p-7"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-2xl border ${v.accent}`}>
                    <v.icon className="size-5" />
                  </span>
                  <span className="font-heading text-sm font-semibold tracking-[0.14em] text-stone-300">
                    {v.n}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-[17px] font-semibold leading-tight text-[#1c1917]">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{v.desc}</p>
                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-stone-500">
                  <span className={`size-1.5 rounded-full ${v.dot}`} /> TAO {boutiquePart}
                </div>
                <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-stone-50 opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {/* mini process */}
          <div
            data-reveal
            className="mt-8 grid gap-3 rounded-[24px] border border-stone-200 bg-stone-50/70 p-3 md:grid-cols-4"
          >
            {[
              { t: "Eliges", d: "Catálogo o a medida" },
              { t: "Componemos", d: "A mano, con detalle" },
              { t: "Cuidamos", d: "Frescura + detalle" },
              { t: "Entregamos", d: "Puntual, con calidez" },
            ].map((s, i) => (
              <div
                key={s.t}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                style={{ transitionDelay: `${i * 60}ms` } as React.CSSProperties}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[#1c1917] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-stone-700">{s.t}</span>
                  <span className="block text-xs text-stone-400">{s.d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO + SEDES ───────────────────────────────────────── */}
      <section id="contacto" className="relative scroll-mt-24 overflow-hidden bg-[#fffbf8] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 h-[640px] w-[980px] -translate-x-1/2 rounded-full bg-[#f1e5e2]/55 blur-[74px]" />
        </div>

        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <SectionLabel icon={Sparkles} kicker="Contacto">
              Estamos aquí para ti
            </SectionLabel>
            <h2 className="mt-4 font-heading text-[1.9rem] font-semibold tracking-[-0.02em] text-[#1c1917] md:text-[2.35rem]">
              Conversemos
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">
              Una consulta, un arreglo a medida o un pedido de último momento — te respondemos con calidez y
              sin demora.
            </p>
          </div>

          {/* contact cards */}
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2" data-reveal>
            {config?.correoMaestro && (
              <a
                href={`mailto:${config.correoMaestro}`}
                className="group flex items-center gap-4 rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <Mail className="size-5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-400">
                    Email
                  </span>
                  <span className="block truncate text-sm font-medium text-stone-700 group-hover:text-amber-700">
                    {config.correoMaestro}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500" />
              </a>
            )}
            {config?.whatsappGeneral && (
              <a
                href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Phone className="size-5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-400">
                    WhatsApp
                  </span>
                  <span className="block truncate text-sm font-medium text-stone-700 group-hover:text-emerald-700">
                    {config.whatsappGeneral}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500" />
              </a>
            )}
          </div>

          {/* socials */}
          {(config?.instagramUrl || config?.facebookUrl || config?.tiktokUrl) && (
            <div data-reveal className="mt-5 flex flex-wrap justify-center gap-2.5">
              {config?.instagramUrl && (
                <a
                  href={sanitizeUrl(config.instagramUrl ?? "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:border-pink-200 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2"
                >
                  <FaInstagram className="size-4 text-pink-500" /> Instagram
                </a>
              )}
              {config?.facebookUrl && (
                <a
                  href={sanitizeUrl(config.facebookUrl ?? "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                >
                  <FaFacebook className="size-4 text-blue-600" /> Facebook
                </a>
              )}
              {config?.tiktokUrl && (
                <a
                  href={sanitizeUrl(config.tiktokUrl ?? "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:border-stone-300 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                >
                  <FaTiktok className="size-4" /> TikTok
                </a>
              )}
            </div>
          )}

          {/* sedes */}
          {sedes && sedesCount > 0 && (
            <div data-reveal className="mt-10">
              {showSedesTitle && (
                <div className="mb-5 flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-stone-200" />
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Nuestras Sedes
                  </h3>
                  <span className="h-px w-8 bg-stone-200" />
                </div>
              )}
              <div
                className={`grid gap-5 mx-auto ${
                  isSingleSede ? "max-w-md grid-cols-1" : "max-w-3xl grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {sedes.map((sede) => (
                  <div
                    key={sede.id}
                    className="rounded-[24px] transition hover:-translate-y-1 focus-within:ring-2 focus-within:ring-brand-mustard focus-within:ring-offset-2"
                  >
                    <SedeCard sede={sede} />
                  </div>
                ))}
              </div>

              {isSingleSede && (
                <p className="mx-auto mt-4 max-w-md text-center text-xs leading-5 text-stone-500">
                  Atendemos toda la ciudad desde nuestra sede principal — escríbenos y coordinamos tu entrega con
                  cuidado.
                </p>
              )}
            </div>
          )}
          {sedesLoading && (
            <div className="mt-10 grid gap-5 mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-[24px] border border-stone-200 bg-stone-100" />
              ))}
            </div>
          )}

          {/* climax CTA */}
          <div
            data-reveal
            className="relative mt-10 overflow-hidden rounded-[28px] border border-stone-200 bg-[#1c1917] p-6 text-white shadow-[0_24px_64px_-20px_rgba(0,0,0,0.35)] md:p-8"
          >
            <GrainOverlay />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-mustard/18 blur-[40px]" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-brand-rose/12 blur-[36px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
                  <span className="size-1.5 rounded-full bg-brand-mustard" /> Siguiente paso
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight tracking-tight md:text-[1.7rem] text-balance">
                  ¿Listo para decirlo con flores?
                </h3>
                <p className="mt-1.5 max-w-[520px] text-sm leading-6 text-white/65">
                  Explora el catálogo o escríbenos — componemos tu arreglo a mano, con frescura del día.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/tienda"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#1c1917] shadow transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1917]"
                >
                  Explorar catálogo <ArrowRight className="size-4" />
                </Link>
                {config?.whatsappGeneral && (
                  <a
                    href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1917]"
                  >
                    <FaWhatsapp className="size-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/tienda"
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:text-[#1c1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2"
            >
              Volver a la tienda
              <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* footer whisper — lockup TAO + nombre */}
      <div className="border-t border-stone-200 bg-white py-6">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center">
          <div className="flex items-center gap-2.5">
            <span className="relative block size-7 overflow-hidden rounded-full border border-stone-200 bg-white">
              <Image src={logoUrl} alt="TAO" fill className="object-contain p-0.5" sizes="28px" />
            </span>
            <span className="font-heading text-sm font-semibold tracking-tight text-stone-700">
              TAO <span className="font-normal text-stone-500">{boutiquePart}</span>
            </span>
            <span className="mx-1 text-stone-300">·</span>
            <span className="text-xs italic tracking-wide text-stone-400">&ldquo;{tagline}&rdquo;</span>
          </div>
          <p className="max-w-xl text-[11px] leading-5 text-stone-400">
            Artesanía floral hecha a mano, con flores frescas del día y entregas cuidadas en cada sede.
          </p>
        </div>
      </div>
    </div>
  );
}
