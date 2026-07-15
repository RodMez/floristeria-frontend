"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductoResponse, CategoriaResponse, ProductoRequest } from "@/types";
import { validateImageFile } from "@/lib/validation";
import Image from "next/image";

/** ─────────── Zod Schema ─────────── */
const productoSchema = z.object({
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  categoriaIds: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos una categoría"),
});

/** ─────────── Types ─────────── */
type ProductoFormData = z.infer<typeof productoSchema>;

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoResponse | null;
  categorias: CategoriaResponse[];
  mutate: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/** ─────────── Component ─────────── */
export function ProductDialog({
  isOpen,
  onClose,
  producto,
  categorias,
  mutate,
}: ProductDialogProps) {
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = producto !== null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      descripcion: "",
      categoriaIds: [],
    },
  });

  const selectedCategoriaIds = watch("categoriaIds") || [];

  useEffect(() => {
    if (isOpen) {
      if (producto) {
        reset({
          sku: producto.sku || "",
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoriaIds: producto.categorias.map((c) => c.id),
        });
      } else {
        reset({
          sku: "",
          nombre: "",
          descripcion: "",
          categoriaIds: [],
        });
      }
      setImagenFile(null);
    }
  }, [isOpen, producto, reset]);

  /** ── Category Toggle ── */
  const handleCategoriaToggle = (catId: number) => {
    const currentIds = watch("categoriaIds") || [];
    if (currentIds.includes(catId)) {
      setValue(
        "categoriaIds",
        currentIds.filter((id) => id !== catId),
        { shouldValidate: true }
      );
    } else {
      setValue("categoriaIds", [...currentIds, catId], {
        shouldValidate: true,
      });
    }
  };

  /** ── Submit Handler ── */
  const onSubmit = async (data: ProductoFormData) => {
    setIsLoading(true);

    try {
      const token = Cookies.get("token");
      let imagenUrl = producto?.imagenUrl || "";

      // Paso 1: Subir imagen si se seleccionó una nueva
      if (imagenFile) {
        const fileError = validateImageFile(imagenFile);
        if (fileError) {
          toast.error(fileError);
          setIsLoading(false);
          return;
        }
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
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl,
        categoriaIds: data.categoriaIds,
      };

      const endpoint = isEditing
        ? `${API_URL}/api/superadmin/productos/${producto!.id}`
        : `${API_URL}/api/superadmin/productos`;

      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar el producto");
      }

      toast.success(isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente");
      mutate();
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sku"
              placeholder="Ej: FLR-001"
              disabled={isLoading}
              {...register("sku")}
            />
            {errors.sku && (
              <p className="text-xs text-red-500">{errors.sku.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Nombre del producto"
              disabled={isLoading}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descripcion"
              placeholder="Descripción del producto"
              disabled={isLoading}
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          {/* Categorías — Grid de Checkboxes */}
          <div className="space-y-2">
            <Label>
              Categorías <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-md border p-4 bg-white">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={selectedCategoriaIds.includes(cat.id)}
                    onCheckedChange={() => handleCategoriaToggle(cat.id)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`cat-${cat.id}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {cat.nombre}
                  </Label>
                </div>
              ))}
            </div>
            {errors.categoriaIds && (
              <p className="text-xs text-red-500">
                {errors.categoriaIds.message}
              </p>
            )}
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen</Label>
            <Input
              id="imagen"
              type="file"
              accept="image/*"
              onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
              disabled={isLoading}
            />
            {isEditing && producto?.imagenUrl && !imagenFile && (
              <div className="space-y-2">
                <p className="text-xs text-stone-500">
                  Imagen actual:
                </p>
                <div className="w-32 h-32 relative rounded overflow-hidden border border-stone-200">
                  <Image
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-stone-500">
                  Selecciona una nueva para reemplazarla.
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
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
