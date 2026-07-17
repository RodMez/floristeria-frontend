"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { ProductoCatalogo, CategoriaResponse, Sede } from "@/types";

interface ProductGridProps {
  productos: ProductoCatalogo[];
  categorias: CategoriaResponse[];
  sede: Sede;
}

export function ProductGrid({ productos, categorias, sede }: ProductGridProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Mapa para buscar ID real por nombre de categoría
  const categoriaNombreToId = useMemo(() => {
    const map = new Map<string, number>();
    categorias.forEach((c) => map.set(c.nombre.toLowerCase(), c.id));
    return map;
  }, [categorias]);

  const filteredProductos = useMemo(() => {
    if (!selectedCategoryId) return productos;
    return productos.filter((p) => {
      // Primero intentar con categorias (formato nuevo con IDs reales)
      if (p.categorias && p.categorias.length > 0) {
        return p.categorias.some((c) => c.id === selectedCategoryId);
      }
      // Fallback: mapear categoriasNombres a IDs reales
      if (p.categoriasNombres && p.categoriasNombres.length > 0) {
        return p.categoriasNombres.some((nombre) =>
          categoriaNombreToId.get(nombre.toLowerCase()) === selectedCategoryId
        );
      }
      // Fallback legacy: categoriaNombre (single)
      if (p.categoriaNombre) {
        return categoriaNombreToId.get(p.categoriaNombre.toLowerCase()) === selectedCategoryId;
      }
      return false;
    });
  }, [productos, selectedCategoryId, categoriaNombreToId]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros - Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategoryId === null
              ? "bg-brand-mustard text-stone-900"
              : "bg-[var(--color-brand-rose-light)]/50 text-stone-700 hover:bg-brand-mustard/15"
          }`}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryId === cat.id
                ? "bg-brand-mustard text-stone-900"
                : "bg-[var(--color-brand-rose-light)]/50 text-stone-700 hover:bg-brand-mustard/15"
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      <p className="text-sm text-stone-500">
        {filteredProductos.length} producto{filteredProductos.length !== 1 ? "s" : ""} encontrado{filteredProductos.length !== 1 ? "s" : ""}
        {selectedCategoryId && (
          <span className="font-medium text-stone-900">
            en {categorias.find((c) => c.id === selectedCategoryId)?.nombre}
          </span>
        )}
      </p>

      {/* Grid de productos */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-brand-rose-dark)] text-lg">
            No hay productos disponibles{selectedCategoryId && " en esta categoría"}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProductos.map((producto, index) => (
            <ProductCard key={producto.productoId} producto={producto} sede={sede} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}