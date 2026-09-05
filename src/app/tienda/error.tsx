"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-rose-light)]" role="alert" aria-live="polite">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-[var(--color-brand-rose-dark)] mb-4" />
        <h2 className="text-xl font-semibold text-stone-800 mb-2">No se pudieron cargar las sedes</h2>
        <p className="text-stone-500 mb-2">Verifica tu conexión e intenta nuevamente.</p>
        {error?.message && <p className="text-xs text-stone-400 mb-6">{error.message}</p>}
        <Button onClick={() => reset()} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-bold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
