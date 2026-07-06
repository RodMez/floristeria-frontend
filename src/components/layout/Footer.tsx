"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede, ConfiguracionTiendaDTO } from "@/types";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Footer() {
  const { data: sedes } = useSWR<Sede[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`,
    fetcher
  );

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* ── Col 1: Brand ───────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-tight text-stone-100">
              TAO
              <span className="text-brand-mustard"> Boutique Floral</span>
            </h3>
            <p className="text-sm leading-relaxed italic text-stone-500">
              &ldquo;Flores que cuentan historias&rdquo;
            </p>
            <p className="text-sm leading-relaxed text-stone-400">
              Transformamos flores en experiencias inolvidables. Diseños exclusivos,
              flores frescas y atención personalizada para cada ocasión especial.
            </p>
          </div>

          {/* ── Col 2: Sedes & Redes Sociales ──────────────── */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-300">
              Nuestras sedes
            </h4>
            {sedes && sedes.length > 0 ? (
              <ul className="space-y-4">
                {sedes.map((sede) => (
                  <li key={sede.id}>
                    <p className="text-sm font-medium text-stone-200">
                      {sede.nombre}
                    </p>
                    <p className="text-xs text-stone-500">{sede.ciudad}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {sede.telefonoWhatsapp && (
                        <a
                          href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-500 hover:text-emerald-400 transition-colors"
                          aria-label={`WhatsApp ${sede.nombre}`}
                        >
                          <FaWhatsapp className="size-4" />
                        </a>
                      )}
                      {sede.instagramUrl && (
                        <a
                          href={sede.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-500 hover:text-pink-400 transition-colors"
                          aria-label={`Instagram ${sede.nombre}`}
                        >
                          <FaInstagram className="size-4" />
                        </a>
                      )}
                      {sede.facebookUrl && (
                        <a
                          href={sede.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-500 hover:text-blue-400 transition-colors"
                          aria-label={`Facebook ${sede.nombre}`}
                        >
                          <FaFacebook className="size-4" />
                        </a>
                      )}
                      {sede.tiktokUrl && (
                        <a
                          href={sede.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-500 hover:text-stone-300 transition-colors"
                          aria-label={`TikTok ${sede.nombre}`}
                        >
                          <FaTiktok className="size-4" />
                        </a>
                      )}
                      {sede.email && (
                        <a
                          href={`mailto:${sede.email}`}
                          className="text-stone-500 hover:text-amber-400 transition-colors"
                          aria-label={`Email ${sede.nombre}`}
                        >
                          <MdEmail className="size-4" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-600 italic">Cargando sedes...</p>
            )}
          </div>

          {/* ── Col 3: Enlaces rápidos ─────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-300">
              Enlaces
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tienda" className="hover:text-brand-mustard transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/tienda/auth" className="hover:text-brand-mustard transition-colors">
                  Mi cuenta
                </Link>
              </li>
              <li>
                <Link href="/tienda/mi-cuenta" className="hover:text-brand-mustard transition-colors">
                  Mis pedidos
                </Link>
              </li>
              <li>
                <Link href="/tienda/auth" className="hover:text-brand-mustard transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 4: Contacto directo ────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-300">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${config?.correoMaestro || "taoboutiquefloral@gmail.com"}`}
                  className="flex items-center gap-2 hover:text-brand-mustard transition-colors"
                >
                  <MdEmail className="size-4 shrink-0 text-brand-mustard" />
                  {config?.correoMaestro || "taoboutiquefloral@gmail.com"}
                </a>
              </li>
              {config?.whatsappGeneral && (
                <li>
                  <a
                    href={`https://wa.me/${config.whatsappGeneral.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                  >
                    <FaWhatsapp className="size-4 shrink-0 text-emerald-400" />
                    {config.whatsappGeneral}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3 pt-2">
                {config?.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-500 hover:text-pink-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="size-5" />
                  </a>
                )}
                {config?.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-500 hover:text-blue-400 transition-colors"
                    aria-label="Facebook"
                  >
                    <FaFacebook className="size-5" />
                  </a>
                )}
                {config?.tiktokUrl && (
                  <a
                    href={config.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-500 hover:text-stone-300 transition-colors"
                    aria-label="TikTok"
                  >
                    <FaTiktok className="size-5" />
                  </a>
                )}
                <a
                  href={`mailto:${config?.correoMaestro || "taoboutiquefloral@gmail.com"}`}
                  className="text-stone-500 hover:text-amber-400 transition-colors"
                  aria-label="Email"
                >
                  <MdEmail className="size-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-stone-800" />

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-stone-600 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TAO Boutique Floral. Todos los derechos reservados.</p>
          <p>
            Hecho con{" "}
            <span className="text-pink-400" aria-label="amor">
              ♥
            </span>{" "}
            para los amantes de las flores
          </p>
        </div>
      </div>
    </footer>
  );
}
