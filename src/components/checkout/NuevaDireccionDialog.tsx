"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useCartStore } from "@/store/useCartStore";
import { DireccionRequest, ZonaDomicilioResponse } from "@/types";
import { fetcher } from "@/lib/fetcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderIcon, MapPin } from "lucide-react";

interface NuevaDireccionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;

export default function NuevaDireccionDialog({
  open,
  onOpenChange,
  onCreated,
}: NuevaDireccionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    alias: "",
    direccion: "",
    detalles: "",
  });
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>("");
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);

  const sedeActual = useCartStore((s) => s.sedeActual);

  const { data: zonas, isLoading: loadingZonas } = useSWR<ZonaDomicilioResponse[]>(
    sedeActual
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/zonas-domicilio/sede/${sedeActual.id}`
      : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  // Localidades únicas
  const localidades = useMemo(() => {
    if (!zonas) return [];
    return [...new Set(zonas.map((z) => z.localidad))].sort();
  }, [zonas]);

  // Barrios filtrados por localidad seleccionada
  const barrios = useMemo(() => {
    if (!zonas || !selectedLocalidad) return [];
    const filtradas = zonas.filter((z) => z.localidad === selectedLocalidad);
    return filtradas.map((z) => ({
      id: z.id,
      label: z.barrio || "Otro",
      hasBarrio: !!z.barrio,
    }));
  }, [zonas, selectedLocalidad]);

  const handleLocalidadChange = (value: string | null) => {
    if (!value || value === "__none") return;
    setSelectedLocalidad(value);
    setSelectedBarrio("");
    setSelectedZonaId(null);
  };

  const handleBarrioChange = (value: string | null) => {
    if (!value || value === "__none") return;
    setSelectedBarrio(value);
    const zona = barrios.find((b) => b.label === value);
    setSelectedZonaId(zona?.id ?? null);
  };

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ alias: "", direccion: "", detalles: "" });
    setSelectedLocalidad("");
    setSelectedBarrio("");
    setSelectedZonaId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.alias.trim() || !form.direccion.trim()) {
      toast.error("Completa los campos obligatorios: alias y dirección.");
      return;
    }

    if (!sedeActual) {
      toast.error("No se encontró la sede actual.");
      return;
    }

    if (!selectedZonaId && zonas && zonas.length > 0) {
      toast.error("Selecciona una zona de domicilio (localidad y barrio).");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          alias: form.alias.trim(),
          direccion: form.direccion.trim(),
          ciudad: sedeActual.ciudad,
          detalles: form.detalles?.trim() || undefined,
          zonaDomicilioId: selectedZonaId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new Error(errorBody || `Error ${res.status}`);
      }

      toast.success("Dirección guardada correctamente.");
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar la dirección."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-t-4 border-t-[var(--color-brand-mustard)]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="size-5 text-[var(--color-brand-rose-dark)]" />
            <DialogTitle className="text-[var(--color-brand-rose-dark)]">
              Nueva dirección
            </DialogTitle>
          </div>
          <DialogDescription>
            Dirección de entrega para {sedeActual?.ciudad ?? "tu sede"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Alias *</Label>
            <Input
              id="alias"
              placeholder="Ej: Casa, Oficina"
              value={form.alias}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={isSubmitting}
              required
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Dirección *</Label>
            <Input
              id="direccion"
              placeholder="Calle 10 # 20-30, Apto 501"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              disabled={isSubmitting}
              required
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Sede de Despacho *</Label>
            <Input
              id="ciudad"
              value={sedeActual?.ciudad ?? ""}
              disabled
              className="bg-[var(--color-brand-rose-light)]/20 text-muted-foreground focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
            />
          </div>

          {/* ── Zona de Domicilio (Selects Dependientes) ─────── */}
          {loadingZonas && sedeActual && (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-md bg-[var(--color-brand-rose-light)]/50" />
              <div className="h-10 animate-pulse rounded-md bg-[var(--color-brand-rose-light)]/50" />
            </div>
          )}

          {!loadingZonas && zonas && zonas.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-brand-rose-dark)] bg-[var(--color-brand-rose-light)]/50 border border-[var(--color-brand-rose)]/20 rounded-md p-3">
              <MapPin className="size-4 shrink-0 text-[var(--color-brand-rose-dark)]" />
              No hay zonas de domicilio configuradas para esta sede. Contacta al administrador.
            </div>
          )}

          {!loadingZonas && zonas && zonas.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">Localidad / Municipio *</Label>
                <Select
                  value={selectedLocalidad}
                  onValueChange={handleLocalidadChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                    <SelectValue placeholder="Selecciona una localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Selecciona una localidad...</SelectItem>
                    {localidades.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLocalidad && (
                <div className="space-y-2">
                <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">Barrio</Label>
                <Select
                  value={selectedBarrio}
                  onValueChange={handleBarrioChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                    <SelectValue placeholder="Selecciona un barrio" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Selecciona un barrio...</SelectItem>
                      {barrios.map((b) => (
                        <SelectItem key={b.id} value={b.label}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="detalles" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Detalles adicionales</Label>
            <Textarea
              id="detalles"
              placeholder="Casa azul, portería, etc."
              value={form.detalles}
              onChange={(e) => handleChange("detalles", e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-[var(--color-brand-rose)]/40 text-[var(--color-brand-rose-dark)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[var(--color-brand-rose-dark)] hover:bg-[var(--color-brand-mustard)] text-white hover:text-stone-900 disabled:opacity-50">
              {isSubmitting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar dirección"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
