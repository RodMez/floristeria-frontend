import { ProductoCatalogo, CategoriaResponse, Sede } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";

async function getCatalogo(sedeId: string): Promise<ProductoCatalogo[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalogo/sede/${sedeId}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getCategorias(): Promise<CategoriaResponse[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categorias`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getSede(sedeId: string): Promise<Sede | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const sedes: Sede[] = await res.json();
    return sedes.find((s) => s.id === Number(sedeId)) || null;
  } catch {
    return null;
  }
}

interface SedePageProps {
  params: Promise<{ sedeId: string }>;
}

export default async function SedePage({ params }: SedePageProps) {
  const { sedeId } = await params;
  const [productos, categorias, sede] = await Promise.all([
    getCatalogo(sedeId),
    getCategorias(),
    getSede(sedeId),
  ]);

  if (!sede) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Sede no encontrada</h1>
        <p className="text-stone-600">La sede solicitada no existe.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">{sede.nombre}</h1>
      <p className="text-stone-600 mb-8">
        Explora nuestros productos disponibles en {sede.ciudad}
      </p>

      <ProductGrid productos={productos} categorias={categorias} sede={sede} />
    </div>
  );
}