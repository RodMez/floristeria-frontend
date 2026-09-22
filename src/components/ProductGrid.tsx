"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductoCatalogo, CategoriaResponse, Sede } from "@/types";

interface ProductGridProps {
  productos: ProductoCatalogo[];
  categorias: CategoriaResponse[];
  sede: Sede;
  /** Si se provee, el buscador lo renderiza el padre (ej. cabecera) y el grid solo filtra. */
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
}

const normalizeText = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ProductGrid({ productos, categorias, sede, searchInput: externalSearchInput, onSearchInputChange }: ProductGridProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [internalSearchInput, setInternalSearchInput] = useState("");
  const controlled = onSearchInputChange !== undefined;
  const searchInput = controlled ? (externalSearchInput ?? "") : internalSearchInput;
  const setSearchInput = onSearchInputChange ?? setInternalSearchInput;
  const searchTerm = useDeferredValue(searchInput);

  // Mapa para buscar ID real por nombre de categoría
  const categoriaNombreToId = useMemo(() => {
    const map = new Map<string, number>();
    categorias.forEach((c) => map.set(c.nombre.toLowerCase(), c.id));
    return map;
  }, [categorias]);

  const filteredProductos = useMemo(() => {
    const term = normalizeText(searchTerm);
    return productos.filter((p) => {
      if (term) {
        const haystack = normalizeText(
          `${p.nombre ?? ""} ${p.descripcion ?? ""} ${p.sku ?? ""}`
        );
        if (!haystack.includes(term)) return false;
      }
      if (!selectedCategoryId) return true;
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
  }, [productos, selectedCategoryId, categoriaNombreToId, searchTerm]);

  const limpiarBusqueda = () => {
    setSearchInput("");
    setSelectedCategoryId(null);
  };

  return (
    <div className="space-y-6">
      {/* Buscador (solo si el padre no lo renderiza, ej. en la cabecera) */}
      {!controlled && (
        <div className="relative max-w-md" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, descripción o SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Buscar productos"
            className="pl-10 pr-10 rounded-full bg-white border-stone-200 focus-visible:ring-[var(--color-brand-mustard)]/40"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

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
            {" "}en {categorias.find((c) => c.id === selectedCategoryId)?.nombre}
          </span>
        )}
        {searchTerm.trim() && (
          <span>
            {" "}que coinciden con <span className="font-medium text-stone-900">“{searchTerm.trim()}”</span>
          </span>
        )}
      </p>

      {/* Grid de productos */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-brand-rose-dark)] text-lg">
            {searchTerm.trim()
              ? `Sin resultados para “${searchTerm.trim()}”.`
              : `No hay productos disponibles${selectedCategoryId ? " en esta categoría" : ""}.`}
          </p>
          {(searchTerm.trim() || selectedCategoryId) && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="mt-4 px-4 py-2 rounded-full text-sm font-medium bg-brand-mustard text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] transition-colors"
            >
              Limpiar búsqueda
            </button>
          )}
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