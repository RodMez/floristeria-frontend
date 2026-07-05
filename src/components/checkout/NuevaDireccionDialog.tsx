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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva dirección</DialogTitle>
          <DialogDescription>
            Dirección de entrega para {sedeActual?.ciudad ?? "tu sede"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alias">Alias *</Label>
            <Input
              id="alias"
              placeholder="Ej: Casa, Oficina"
              value={form.alias}
              onChange={(e) => handleChange("alias", e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              placeholder="Calle 10 # 20-30, Apto 501"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">Sede de Despacho *</Label>
            <Input
              id="ciudad"
              value={sedeActual?.ciudad ?? ""}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          {/* ── Zona de Domicilio (Selects Dependientes) ─────── */}
          {loadingZonas && sedeActual && (
            <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
              <LoaderIcon className="size-4 animate-spin" />
              Cargando zonas de domicilio...
            </div>
          )}

          {!loadingZonas && zonas && zonas.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
              <MapPin className="size-4 shrink-0" />
              No hay zonas de domicilio configuradas para esta sede. Contacta al administrador.
            </div>
          )}

          {!loadingZonas && zonas && zonas.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Localidad / Municipio *</Label>
                <Select
                  value={selectedLocalidad}
                  onValueChange={handleLocalidadChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
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
                  <Label>Barrio</Label>
                  <Select
                    value={selectedBarrio}
                    onValueChange={handleBarrioChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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
            <Label htmlFor="detalles">Detalles adicionales</Label>
            <Textarea
              id="detalles"
              placeholder="Casa azul, portería, etc."
              value={form.detalles}
              onChange={(e) => handleChange("detalles", e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
