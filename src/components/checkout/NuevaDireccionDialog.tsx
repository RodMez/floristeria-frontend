"use client";

import { useState } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { DireccionRequest } from "@/types";
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
import { LoaderIcon } from "lucide-react";

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
  const [form, setForm] = useState<DireccionRequest>({
    alias: "",
    direccion: "",
    ciudad: "",
    detalles: "",
  });

  const handleChange = (field: keyof DireccionRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ alias: "", direccion: "", ciudad: "", detalles: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.alias.trim() || !form.direccion.trim() || !form.ciudad.trim()) {
      toast.error("Completa los campos obligatorios: alias, dirección y ciudad.");
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
          ciudad: form.ciudad.trim(),
          detalles: form.detalles?.trim() || undefined,
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
            Agrega una dirección de entrega para tus pedidos.
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
            <Label htmlFor="ciudad">Ciudad *</Label>
            <Input
              id="ciudad"
              placeholder="Bogotá"
              value={form.ciudad}
              onChange={(e) => handleChange("ciudad", e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

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
