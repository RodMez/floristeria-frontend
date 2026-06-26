"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InventarioResponse } from "@/types";

interface EditInventarioDialogProps {
  item: InventarioResponse;
  mutate: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const inventarioSchema = z.object({
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  descuentoPorcentaje: z.coerce.number().min(0).max(100, "El descuento debe estar entre 0 y 100"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
});

export function EditInventarioDialog({ item, mutate }: EditInventarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [precio, setPrecio] = useState(item.precio.toString());
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState((item.descuentoPorcentaje ?? 0).toString());
  const [stock, setStock] = useState(item.stock.toString());
  const [disponible, setDisponible] = useState(item.disponible);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = inventarioSchema.safeParse({ precio, descuentoPorcentaje, stock });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${API_URL}/api/admin/inventario/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            precio: parsed.data.precio,
            descuentoPorcentaje: parsed.data.descuentoPorcentaje,
            stock: parsed.data.stock,
            disponible,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Error al actualizar el inventario");
      }

      toast.success("Inventario actualizado correctamente");
      mutate();
      setOpen(false);
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error(`Error al actualizar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-stone-200 bg-white hover:bg-stone-100 hover:text-stone-900 h-8 px-3"
      >
        Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Inventario - {item.productoNombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (COP)</Label>
              <Input
                id="precio"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                disabled={isLoading}
              />
              {errors.precio && (
                <p className="text-xs text-red-500">{errors.precio}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento (%)</Label>
              <Input
                id="descuento"
                type="number"
                min={0}
                max={100}
                value={descuentoPorcentaje}
                onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                disabled={isLoading}
              />
              {errors.descuentoPorcentaje && (
                <p className="text-xs text-red-500">{errors.descuentoPorcentaje}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={isLoading}
              />
              {errors.stock && (
                <p className="text-xs text-red-500">{errors.stock}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="disponible"
              checked={disponible}
              onCheckedChange={setDisponible}
              disabled={isLoading}
            />
            <Label htmlFor="disponible">Disponible para venta</Label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}