import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Sede } from "@/types";

async function getSedes(): Promise<Sede[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const sedes = await getSedes();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            🌸 Bienvenido a la Floristería 
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Encuentra los arreglos florales más hermosos y frescos para cada ocasión.
            Selecciona tu sede más cercana para comenzar.
          </p>
        </div>
      </section>

      {/* Grid de Sedes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold text-stone-800 mb-8">
          Nuestras Sedes
        </h2>

        {sedes.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No hay sedes disponibles en este momento.
          </p>
        ) : (
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
        )}
      </section>
    </div>
  );
}
