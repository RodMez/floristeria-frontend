"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductoResponse, CategoriaResponse, ProductoRequest } from "@/types";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoResponse | null;
  categorias: CategoriaResponse[];
  mutate: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function ProductDialog({
  isOpen,
  onClose,
  producto,
  categorias,
  mutate,
}: ProductDialogProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = producto !== null;

  useEffect(() => {
    if (isOpen) {
      if (producto) {
        setNombre(producto.nombre);
        setDescripcion(producto.descripcion);
        setCategoriaId(producto.categoriaId);
      } else {
        setNombre("");
        setDescripcion("");
        setCategoriaId(categorias.length > 0 ? categorias[0].id : 0);
      }
      setImagenFile(null);
    }
  }, [isOpen, producto, categorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = Cookies.get("token");
      let imagenUrl = producto?.imagenUrl || "";

      // Paso 1: Subir imagen si se seleccionó una nueva
      if (imagenFile) {
        const formData = new FormData();
        formData.append("archivo", imagenFile);

        const uploadRes = await fetch(`${API_URL}/api/superadmin/imagenes`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Error al subir la imagen");
        const { url } = await uploadRes.json();
        imagenUrl = url;
      }

      // Paso 2: Guardar producto
      const payload: ProductoRequest = {
        nombre,
        descripcion,
        imagenUrl,
        categoriaId,
      };

      const endpoint = isEditing
        ? `${API_URL}/api/superadmin/productos/${producto.id}`
        : `${API_URL}/api/superadmin/productos`;

      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
            'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar el producto");

      mutate();
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del producto"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del producto"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={categoriaId.toString()}
              onValueChange={(val: string | null) => {
                if (val) setCategoriaId(Number(val));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen</Label>
            <Input
              id="imagen"
              type="file"
              accept="image/*"
              onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
              disabled={isLoading}
            />
            {isEditing && producto.imagenUrl && !imagenFile && (
              <p className="text-xs text-stone-500">
                Imagen actual conservada. Selecciona una nueva para reemplazarla.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
