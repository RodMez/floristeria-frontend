"use client";

import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { DireccionResponse } from "@/types";
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
  // SWR condicional: solo fetch cuando enabled=true
  const { data: direcciones, error, mutate } = useSWR<DireccionResponse[]>(
    enabled ? API_URL : null,
    fetcher
  );
  const [dialogOpen, setDialogOpen] = useState(false);

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
  if (direcciones.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-6 text-center">
            <MapPinIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-muted-foreground mb-3">
              No tienes direcciones guardadas.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
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
        {direcciones.map((dir) => {
          const isSelected = selectedDireccionId === dir.id;

          return (
            <Card
              key={dir.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:ring-1 hover:ring-foreground/20"
              }`}
              onClick={() => onSelect(dir.id)}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5">
                  {isSelected ? (
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3.5" />
                    </div>
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full border border-input" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{dir.alias}</span>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Seleccionada
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {dir.direccion}, {dir.ciudad}
                  </p>
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
          className="w-full"
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
