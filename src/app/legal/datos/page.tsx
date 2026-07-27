import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Política de Tratamiento de Datos Personales",
  description:
    "Política de Tratamiento de Datos Personales de TAO Boutique Floral conforme a la Ley 1581 de 2012 de Colombia.",
};

export default function PoliticaDatosPage() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">
            Política de Tratamiento de Datos Personales
          </h1>
          <p className="text-sm text-stone-500 mb-8">
            Última actualización: pendiente de redacción legal — versión del documento:{" "}
            <code className="px-2 py-0.5 rounded bg-stone-100">v1 (placeholder)</code>
          </p>

          <div className="rounded-xl border-2 border-brand-rose bg-white/70 p-8 space-y-4">
            <p className="text-stone-700 leading-relaxed">
              El contenido íntegro de esta Política de Tratamiento de Datos
              Personales se encuentra <strong>pendiente de redacción y revisión
              legal por un abogado colombiano</strong> especializado en protección
              de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013).
            </p>
            <p className="text-stone-700 leading-relaxed">
              Esta página existe únicamente como <em>placeholder navegable</em>
              {" "}para evitar enlaces rotos en los formularios de registro y
              checkout. Una vez publicado el documento oficial, esta página será
              sustituida automáticamente con el texto definitivo.
            </p>
            <p className="text-stone-600 text-sm">
              Mientras tanto, para cualquier consulta sobre el tratamiento de tus
              datos personales puedes escribirnos a través de los canales de
              contacto publicados en la sección{" "}
              <Link href="/tienda/nosotros" className="underline text-brand-mustard hover:text-brand-mustard-dark font-medium">
                Nosotros
              </Link>
              .
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1 text-brand-mustard hover:text-brand-mustard-dark font-medium transition-colors"
            >
              Volver a la tienda <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
