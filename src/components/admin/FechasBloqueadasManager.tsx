"use client";

import { useState } from "react";
import useSWR from "swr";
import { authFetch, fetcher } from "@/lib/fetcher";
import { FechaBloqueadaDTO } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarOff, Plus, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const DIA_LABEL: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábados",
  SUNDAY: "Domingos",
};

export default function FechasBloqueadasManager({
  sedeId,
  sedeNombre,
  diasNoEntrega,
}: {
  sedeId: number;
  sedeNombre: string;
  diasNoEntrega?: string | null;
}) {
  const diasSemanales = (diasNoEntrega ?? "")
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter((d) => d in DIA_LABEL);
  const [open, setOpen] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  const { data: bloqueos, mutate, isLoading } = useSWR<FechaBloqueadaDTO[]>(
    open ? `${API_URL}/api/admin/sedes/${sedeId}/fechas-bloqueadas` : null,
    fetcher
  );

  const handleAgregar = async () => {
    if (!nuevaFecha) {
      toast.error("Elige una fecha para bloquear.");
      return;
    }
    try {
      await authFetch(`${API_URL}/api/admin/sedes/${sedeId}/fechas-bloqueadas`, {
        method: "POST",
        body: JSON.stringify({ fecha: nuevaFecha, motivo: motivo || undefined }),
      });
      toast.success("Fecha bloqueada.");
      setNuevaFecha("");
      setMotivo("");
      mutate();
    } catch (e) {
      toast.error(parseMensaje(e));
    }
  };

  const parseMensaje = (e: unknown) => {
    if (!(e instanceof Error)) return "No se pudo bloquear la fecha.";
    try {
      const j = JSON.parse(e.message);
      return j.mensaje || j.message || e.message;
    } catch {
      return e.message;
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await authFetch(`${API_URL}/api/admin/sedes/${sedeId}/fechas-bloqueadas/${id}`, {
        method: "DELETE",
      });
      toast.success("Bloqueo eliminado.");
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        title="Bloquear días sin entrega"
        onClick={() => setOpen(true)}
      >
        <CalendarOff className="h-3.5 w-3.5 mr-1" />
        Días cerrados
      </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Días cerrados — {sedeNombre}</DialogTitle>
          <DialogDescription>
            Bloquea fechas puntuales (inventario, festivos propios). El checkout no permitirá elegirlas.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-stone-50 px-3 py-2">
          <p className="text-xs font-semibold text-stone-600">Cierre semanal</p>
          {diasSemanales.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {diasSemanales.map((d) => (
                <span key={d} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {DIA_LABEL[d]} cerrado
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-stone-500">Sin cierre semanal: se entrega todos los días.</p>
          )}
          <p className="mt-1 text-[11px] text-stone-400">Se configura en Editar sede.</p>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor={`fecha-${sedeId}`}>Fecha</Label>
            <Input
              id={`fecha-${sedeId}`}
              type="date"
              value={nuevaFecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setNuevaFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`motivo-${sedeId}`}>Motivo</Label>
            <Input
              id={`motivo-${sedeId}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Inventario"
              maxLength={200}
            />
          </div>
          <Button onClick={handleAgregar} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5">
          {isLoading && <p className="text-xs text-stone-500">Cargando...</p>}
          {!isLoading && (!bloqueos || bloqueos.length === 0) && (
            <p className="text-xs text-stone-500">Sin fechas bloqueadas.</p>
          )}
          {bloqueos?.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm">
              <span>
                <span className="font-mono">{b.fecha}</span>
                {b.motivo && <span className="text-stone-500"> · {b.motivo}</span>}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => handleEliminar(b.id)} title="Eliminar bloqueo">
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
