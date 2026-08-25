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
} from "lucide-react";
import SedeCard from "@/components/SedeCard";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  MdEmail,
} from "@/components/icons/SocialIcons";
import { sanitizeUrl } from "@/lib/validation";
import { motion, useReducedMotion } from "framer-motion";

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-rose bg-white px-4 py-1.5 shadow-sm">
      <Icon className="size-3.5 text-brand-mustard" />
      <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-stone-500">
        {children}
      </span>
    </div>
  );
}

function EditorialDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <span className="h-px w-12 bg-brand-mustard/30" />
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-rose bg-white text-brand-rose-dark">
        <Heart className="size-3.5" />
      </span>
      <span className="h-px w-12 bg-brand-mustard/30" />
    </div>
  );
}

export default function NosotrosPage() {
  const shouldReduceMotion = useReducedMotion();
  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );
  const { sedes, esUnicaSede } = useSedes();

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

  const sitiNombreParts = sitioNombre.split(" ");
  const nombreBase = sitiNombreParts[0];
  const nombreAcento = sitiNombreParts.slice(1).join(" ");

  const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

  const fadeUp = (delay = 0) => ({
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.62, ease, delay },
    },
  });

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const historiaParagraphs = hasHistoria
    ? historia.split(/\n\s*\n/).flatMap((block) =>
        block
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    : [];

  // Fallback if no double line breaks, keep original split
  const descripcionParagraphs = hasDescripcion
    ? descripcion
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#fffbf8] selection:bg-brand-mustard/30">
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* ── HERO · sutil elegante ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-brand-rose-light)] via-[#fff5f1] to-white">
        {/* decorative blurs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-brand-rose/20 blur-[90px]" />
          <div className="absolute -top-20 right-0 h-[420px] w-[420px] rounded-full bg-brand-mustard/12 blur-[80px]" />
          <div className="absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-rose/30 to-transparent" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeUp(0)} className="mb-6 flex justify-center">
              <SectionLabel icon={Leaf}>Nuestra Casa</SectionLabel>
            </motion.div>

            {/* Logo card with subtle float */}
            <motion.div
              variants={fadeUp(0.08)}
              className="relative mx-auto mb-8 w-fit"
            >
              <motion.div
                animate={
                  shouldReduceMotion
                    ? {}
                    : { y: [0, -6, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? {}
                    : {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
                className="relative mx-auto h-44 w-44 overflow-hidden rounded-[28px] border border-white bg-white/70 p-4 shadow-[0_20px_60px_-24px_rgba(212,164,158,0.55)] backdrop-blur-md md:h-56 md:w-56 md:p-5"
              >
                <Image
                  src={logoUrl}
                  alt={sitioNombre}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 176px, 224px"
                  priority
                />
              </motion.div>
              {/* soft shadow */}
              <div className="absolute -bottom-3 left-1/2 h-6 w-32 -translate-x-1/2 rounded-full bg-brand-rose-dark/10 blur-xl" />
            </motion.div>

            <motion.h1
              variants={fadeUp(0.16)}
              className="font-heading text-[2.2rem] font-semibold leading-[0.95] tracking-tight text-[var(--admin-sidebar)] md:text-5xl lg:text-[3.4rem]"
            >
              <span className="inline-block">{nombreBase}</span>
              {nombreAcento && (
                <span className="inline-block text-brand-mustard">
                  {" "}
                  {nombreAcento}
                </span>
              )}
            </motion.h1>

            <motion.p
              variants={fadeUp(0.24)}
              className="mx-auto mt-4 max-w-2xl text-[15px] font-light italic leading-relaxed text-stone-500 md:text-lg"
            >
              &ldquo;{tagline}&rdquo;
            </motion.p>

            <motion.div
              variants={fadeUp(0.32)}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <a
                href="#historia"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--admin-sidebar)] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/15"
              >
                Conoce nuestra historia
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/tienda"
                className="inline-flex items-center gap-2 rounded-full border border-brand-rose bg-white px-6 py-3 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-brand-mustard hover:text-brand-mustard-dark"
              >
                Explorar catálogo
              </Link>
            </motion.div>

            {/* tiny editorial note */}
            <motion.p
              variants={fadeUp(0.42)}
              className="mt-10 text-xs tracking-wide text-stone-400"
            >
              Artesanía floral · Desde el corazón de cada sede
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── NUESTRA ESENCIA · descripcion ─────────────────────── */}
      {hasDescripcion && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="relative py-14 md:py-20"
        >
          <div className="container mx-auto max-w-3xl px-4">
            <motion.div variants={fadeUp()} className="mb-8 text-center">
              <SectionLabel icon={Sparkles}>Nuestra esencia</SectionLabel>
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-stone-800 md:text-4xl">
                Flores que cuentan historias
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
                No solo creamos ramos. Traducimos emociones en textura, color y perfume.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="relative rounded-[28px] border border-brand-rose/40 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.12)] md:p-10"
            >
              <Quote className="absolute -top-3 -left-3 size-8 rounded-full border border-brand-rose bg-brand-mustard p-1.5 text-white shadow-sm md:-top-4 md:-left-4 md:size-9" />
              <div className="space-y-5">
                {descripcionParagraphs.map((p, i) => (
                  <motion.p
                    key={i}
                    variants={fadeUp(i * 0.06)}
                    className="text-[15px] leading-7 text-stone-600"
                  >
                    {p}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      <div className="container mx-auto max-w-5xl px-4">
        <EditorialDivider />
      </div>

      {/* ── HISTORIA · TEXTO COMPLETO + IMAGEN lado a lado ───── */}
      {hasHistoriaSection && (
        <motion.section
          id="historia"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative overflow-hidden py-14 md:py-20"
        >
          {/* soft bg wash */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-rose-light/40 blur-[70px]" />
          </div>

          <div className="container mx-auto max-w-6xl px-4">
            <motion.div variants={fadeUp()} className="mb-10 text-center">
              <SectionLabel icon={Heart}>Nuestra Historia</SectionLabel>
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-stone-800 md:text-4xl">
                El arte de transformar flores en recuerdos
              </h2>
            </motion.div>

            {/* Caso: ambos → grid 50/50 */}
            {hasHistoria && hasHistoriaImagen ? (
              <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
                {/* Imagen */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: shouldReduceMotion ? 0 : 16,
                      scale: shouldReduceMotion ? 1 : 0.98,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.7, ease },
                    },
                  }}
                  className="group relative"
                >
                  <div className="overflow-hidden rounded-[24px] border border-brand-rose bg-white shadow-[0_24px_64px_-24px_rgba(212,164,158,0.55)]">
                    {/* subtle grain overlay */}
                    <div className="pointer-events-none absolute inset-0 z-10 rounded-[24px] ring-1 ring-white/60" />
                    <motion.img
                      src={historiaImagenUrl}
                      alt="Nuestra Historia"
                      className="h-auto w-full object-cover"
                      whileHover={shouldReduceMotion ? {} : { scale: 1.015 }}
                      transition={{ duration: 0.6, ease }}
                      loading="lazy"
                    />
                  </div>
                  {/* caption */}
                  <div className="absolute -bottom-4 left-4 z-20 hidden rounded-full border border-brand-rose bg-white px-4 py-1.5 text-xs font-medium text-stone-600 shadow-md md:flex items-center gap-1.5">
                    <Leaf className="size-3.5 text-brand-sage" />
                    Hecho a mano, con amor
                  </div>
                </motion.div>

                {/* Texto completo */}
                <motion.div variants={fadeUp(0.12)} className="relative">
                  <div className="rounded-[24px] border border-brand-rose/30 bg-white/80 p-7 backdrop-blur-sm md:p-8">
                    <div className="mb-4 flex items-center gap-2 text-brand-mustard">
                      <Quote className="size-5" />
                      <span className="h-px w-8 bg-brand-mustard/30" />
                    </div>
                    <div className="space-y-4">
                      {historiaParagraphs.map((para, idx) => (
                        <motion.p
                          key={idx}
                          variants={fadeUp(idx * 0.04)}
                          className="text-[15px] leading-7 text-stone-600"
                        >
                          {para}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : hasHistoria ? (
              /* Solo texto → centrado editorial ancho */
              <motion.div
                variants={fadeUp(0.1)}
                className="mx-auto max-w-3xl rounded-[24px] border border-brand-rose/30 bg-white p-8 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] md:p-10"
              >
                <div className="mb-6 flex items-center gap-2 text-brand-mustard">
                  <Quote className="size-5" />
                  <span className="h-px w-8 bg-brand-mustard/30" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
                    Nuestra Historia
                  </span>
                </div>
                <div className="space-y-4">
                  {historiaParagraphs.map((para, idx) => (
                    <motion.p
                      key={idx}
                      variants={fadeUp(idx * 0.04)}
                      className="text-[15px] leading-7 text-stone-600"
                    >
                      {para}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Solo imagen → max-w-2xl centrado (comportamiento legacy mejorado) */
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14, scale: shouldReduceMotion ? 1 : 0.98 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease } },
                }}
                className="mx-auto max-w-2xl"
              >
                <div className="overflow-hidden rounded-[24px] border border-brand-rose bg-white shadow-[0_24px_64px_-24px_rgba(212,164,158,0.45)]">
                  <motion.img
                    src={historiaImagenUrl}
                    alt="Nuestra Historia"
                    className="h-auto w-full object-cover"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.015 }}
                    transition={{ duration: 0.6, ease }}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>
      )}

      {/* ── MISIÓN / VISIÓN ───────────────────────────────────── */}
      {hasMisionVision && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="relative border-y border-brand-rose/20 bg-brand-rose-light/35 py-14 md:py-20"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-70" />
          <div className="container mx-auto max-w-5xl px-4">
            <motion.div variants={fadeUp()} className="mb-10 text-center">
              <SectionLabel icon={Target}>Propósito</SectionLabel>
              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-stone-800 md:text-4xl">
                Lo que nos mueve
              </h2>
            </motion.div>

            <div
              className={`grid gap-6 md:gap-8 ${mision && vision ? "md:grid-cols-2" : "mx-auto max-w-2xl grid-cols-1"}`}
            >
              {mision && (
                <motion.div
                  variants={fadeUp(0.08)}
                  whileHover={shouldReduceMotion ? {} : { y: -4 }}
                  transition={{ duration: 0.35, ease }}
                  className="group relative overflow-hidden rounded-[24px] border border-brand-rose bg-white p-7 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] md:p-8"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-mustard/10 blur-2xl transition-colors group-hover:bg-brand-mustard/18" />
                  <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-mustard/20 bg-brand-mustard/10 text-brand-mustard">
                    <Target className="size-6" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-stone-800">Misión</h3>
                  <p className="mt-3 text-[15px] leading-7 text-stone-600">{mision}</p>
                </motion.div>
              )}
              {vision && (
                <motion.div
                  variants={fadeUp(0.16)}
                  whileHover={shouldReduceMotion ? {} : { y: -4 }}
                  transition={{ duration: 0.35, ease }}
                  className="group relative overflow-hidden rounded-[24px] border border-brand-rose bg-white p-7 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] md:p-8"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-rose/20 blur-2xl transition-colors group-hover:bg-brand-rose/30" />
                  <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-rose bg-brand-rose/15 text-brand-rose-dark">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-stone-800">Visión</h3>
                  <p className="mt-3 text-[15px] leading-7 text-stone-600">{vision}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── VALORES · añadido sutil elegante ─────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="py-14 md:py-20"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div variants={fadeUp()} className="mx-auto max-w-2xl text-center">
            <SectionLabel icon={Flower2}>Nuestros pilares</SectionLabel>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-stone-800 md:text-4xl">
              Detalles que hacen la diferencia
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Cada entrega lleva nuestro compromiso silencioso con la calidad y la cercanía.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Flower2,
                title: "Frescura que perdura",
                desc: "Seleccionamos cada tallo el mismo día. Flores que llegan vibrantes y se mantienen hermosas por más tiempo.",
                accent: "bg-brand-sage/10 border-brand-sage/20 text-brand-sage",
              },
              {
                icon: Palette,
                title: "Diseño con alma",
                desc: "Cada arreglo es una composición única, pensada para la persona y el momento que celebra.",
                accent: "bg-brand-mustard/10 border-brand-mustard/20 text-brand-mustard",
              },
              {
                icon: HandHeart,
                title: "Cercanía real",
                desc: "Asesoría humana, respuesta rápida y entregas puntuales en cada sede, sin letras pequeñas.",
                accent: "bg-brand-rose/15 border-brand-rose text-brand-rose-dark",
              },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp(i * 0.08)}
                whileHover={shouldReduceMotion ? {} : { y: -6 }}
                transition={{ duration: 0.35, ease }}
                className="group rounded-[24px] border border-stone-200 bg-white p-7 shadow-sm transition-all hover:border-brand-rose hover:shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)]"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${v.accent}`}
                >
                  <v.icon className="size-5" />
                </div>
                <h3 className="font-heading text-base font-semibold text-stone-800">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── CONTACTO + SEDES ──────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="relative overflow-hidden bg-[#fffbf8] py-14 md:py-20"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-rose-light/50 blur-[70px]" />
        </div>

        <div className="container mx-auto max-w-3xl px-4 text-center">
          <motion.div variants={fadeUp()}>
            <SectionLabel icon={Sparkles}>Contacto</SectionLabel>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-stone-800 md:text-4xl">
              Estamos aquí para ti
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
              Ya sea una consulta, un arreglo a medida o un pedido de último momento, te respondemos con calidez y rapidez.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            {config?.correoMaestro && (
              <motion.a
                variants={fadeUp()}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                href={`mailto:${config.correoMaestro}`}
                className="group flex max-w-[360px] items-center gap-3 rounded-2xl border border-brand-rose bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-brand-mustard hover:shadow-md"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <MdEmail className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium tracking-wide text-stone-400">Email</span>
                  <span className="block break-words text-sm font-medium text-stone-700 group-hover:text-amber-600">
                    {config.correoMaestro}
                  </span>
                </span>
              </motion.a>
            )}
            {config?.whatsappGeneral && (
              <motion.a
                variants={fadeUp(0.08)}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex max-w-[360px] items-center gap-3 rounded-2xl border border-brand-rose bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <FaWhatsapp className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium tracking-wide text-stone-400">WhatsApp</span>
                  <span className="block break-words text-sm font-medium text-stone-700 group-hover:text-emerald-600">
                    {config.whatsappGeneral}
                  </span>
                </span>
              </motion.a>
            )}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="mt-6 flex flex-wrap justify-center gap-3"
          >
            {config?.instagramUrl && (
              <motion.a
                variants={fadeUp()}
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                href={sanitizeUrl(config.instagramUrl ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-brand-rose bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-pink-200 hover:text-pink-600"
              >
                <FaInstagram className="size-4 text-pink-500" /> Instagram
              </motion.a>
            )}
            {config?.facebookUrl && (
              <motion.a
                variants={fadeUp(0.06)}
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                href={sanitizeUrl(config.facebookUrl ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-brand-rose bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600"
              >
                <FaFacebook className="size-4 text-blue-600" /> Facebook
              </motion.a>
            )}
            {config?.tiktokUrl && (
              <motion.a
                variants={fadeUp(0.12)}
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                href={sanitizeUrl(config.tiktokUrl ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-brand-rose bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-stone-200 hover:text-stone-900"
              >
                <FaTiktok className="size-4" /> TikTok
              </motion.a>
            )}
          </motion.div>

          {/* Sedes */}
          {sedes && sedes.length > 0 && (
            <motion.div variants={fadeUp(0.16)} className="mt-12">
              {!esUnicaSede && (
                <h3 className="mb-4 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Nuestras Sedes
                </h3>
              )}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className={`grid gap-6 md:gap-8 max-w-2xl mx-auto ${esUnicaSede ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
              >
                {sedes.map((sede, idx) => (
                  <motion.div
                    key={sede.id}
                    variants={fadeUp(idx * 0.08)}
                    whileHover={shouldReduceMotion ? {} : { y: -4 }}
                    transition={{ duration: 0.32, ease }}
                  >
                    <SedeCard sede={sede} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          <motion.div variants={fadeUp(0.2)} className="mt-12">
            <Link
              href="/tienda"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-mustard transition-colors hover:text-brand-mustard-dark"
            >
              Volver a la tienda
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* footer whisper */}
      <div className="border-t border-brand-rose/20 bg-white py-6 text-center text-xs tracking-wide text-stone-400">
        <span className="font-heading font-medium text-stone-500">{sitioNombre}</span>
        <span className="mx-2 text-stone-300">·</span>
        <span className="italic">&ldquo;{tagline}&rdquo;</span>
      </div>
    </div>
  );
}
