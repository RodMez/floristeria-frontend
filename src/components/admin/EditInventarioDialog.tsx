"use client";

import { useState } from "react";
import Cookies from "js-cookie";
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

export function EditInventarioDialog({ item, mutate }: EditInventarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [precio, setPrecio] = useState(item.precio.toString());
  const [stock, setStock] = useState(item.stock.toString());
  const [disponible, setDisponible] = useState(item.disponible);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
            precio: parseFloat(precio),
            stock: parseInt(stock, 10),
            disponible,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el inventario");
      }

      mutate();
      setOpen(false);
    } catch (error) {
      console.error("Error updating inventory:", error);
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
