"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { fetcher } from "@/lib/fetcher";
import { DireccionResponse, ZonaDomicilioResponse } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPinIcon, PlusIcon, CheckIcon } from "lucide-react";
import NuevaDireccionDialog from "./NuevaDireccionDialog";

interface DireccionSelectorProps {
  /** Si es false, SWR no hace fetch (protección de ruta). */
  enabled: boolean;
  selectedDireccionId: number | null;
  onSelect: (id: number) => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;

export default function DireccionSelector({
  enabled,
  selectedDireccionId,
  onSelect,
}: DireccionSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const sedeActual = useCartStore((state) => state.sedeActual);

  // SWR condicional: solo fetch cuando enabled=true
  const { data: direcciones, error, mutate } = useSWR<DireccionResponse[]>(
    enabled ? API_URL : null,
    fetcher
  );

  // Fetch zonas de la sede actual para filtrar direcciones
  const { data: zonas } = useSWR<ZonaDomicilioResponse[]>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${sedeActual.id}`
      : null,
    fetcher
  );

  // Filtrar direcciones que pertenezcan a zonas de la sede actual
  const direccionesFiltradas = useMemo(() => {
    if (!direcciones || !zonas) return direcciones ?? [];
    const zonaIds = new Set(zonas.map((z) => z.id));
    return direcciones.filter((d) => zonaIds.has(d.zonaDomicilioId));
  }, [direcciones, zonas]);

  // ── Esperando habilitación ────────────────────────────────────
  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  // ── Error de carga ───────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Error al cargar direcciones. Intenta de nuevo.
        </CardContent>
      </Card>
    );
  }

  // ── Cargando ─────────────────────────────────────────────────
  if (!direcciones) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Cargando direcciones...
        </CardContent>
      </Card>
    );
  }

  // ── Sin direcciones ──────────────────────────────────────────
  if (direccionesFiltradas.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-6 text-center">
            <MapPinIcon className="mx-auto mb-2 size-8 text-[var(--color-brand-rose-dark)]" />
            <p className="text-[var(--color-brand-rose-dark)] mb-3">
              No tienes direcciones guardadas.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="border-[var(--color-brand-rose)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
            >
              <PlusIcon className="size-4" />
              Agregar dirección
            </Button>
          </CardContent>
        </Card>

        <NuevaDireccionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={() => mutate()}
        />
      </>
    );
  }

  // ── Lista de direcciones ─────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        {direccionesFiltradas.map((dir) => {
          const isSelected = selectedDireccionId === dir.id;

          return (
            <Card
              key={dir.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-[var(--color-brand-mustard)] bg-[var(--color-brand-mustard)]/5"
                  : "hover:ring-1 hover:ring-[var(--color-brand-mustard)]/20"
              }`}
              onClick={() => onSelect(dir.id)}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5">
                  {isSelected ? (
                    <div className="flex size-5 items-center justify-center rounded-full bg-[var(--color-brand-mustard)]">
                      <CheckIcon className="size-3.5 text-stone-900" />
                    </div>
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full border border-input" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{dir.alias}</span>
                    {isSelected && (
                      <Badge className="bg-[var(--color-brand-mustard)] text-stone-900 text-xs">
                        Seleccionada
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {dir.direccion}, {dir.ciudad}
                  </p>
                  {dir.zonaDomicilioNombre && (
                    <p className="text-xs text-[var(--color-brand-rose-dark)]/70 mt-0.5">
                      Zona: {dir.zonaDomicilioNombre}
                    </p>
                  )}
                  {dir.detalles && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                      {dir.detalles}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-full border-[var(--color-brand-rose)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon className="size-4" />
          Agregar nueva dirección
        </Button>
      </div>

      <NuevaDireccionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => mutate()}
      />
    </>
  );
}
