import { redirect } from "next/navigation";
import { Sede } from "@/types";
import { MapPin } from "lucide-react";
import BannerCarousel from "@/components/banner/BannerCarousel";
import SedeCard from "@/components/SedeCard";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getSedes(): Promise<Sede[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL no configurado");
  const res = await fetch(`${API_URL}/api/v1/sedes`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Error ${res.status}`);
  }
  return res.json();
}

export default async function Home() {
  let sedes: Sede[];
  try {
    sedes = await getSedes();
  } catch (e) {
    // No tragarse redirect
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    throw e;
  }

  if (sedes.length === 1) {
    redirect(`/tienda/sede/${sedes[0].id}`);
  }

  if (sedes.length === 0) {
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
