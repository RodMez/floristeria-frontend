"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { ImageIcon, Package, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (imagenFile) {
      const url = URL.createObjectURL(imagenFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imagenFile]);

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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col border-t-4 border-t-[var(--color-brand-rose)] border-b-4 border-b-[var(--color-brand-rose)] p-0">
        <DialogHeader className="border-b border-[var(--admin-border)] px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="size-5 text-[var(--color-brand-mustard)]" />
            <DialogTitle className="text-[var(--color-brand-mustard)]">
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing ? "Actualiza los datos del producto." : "Registra un nuevo producto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
              SKU <span>*</span>
            </Label>
            <Input
              id="sku"
              placeholder="Ej: FLR-001"
              disabled={isLoading}
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              {...register("sku")}
            />
            {errors.sku && (
              <p className="text-xs text-[var(--admin-danger-foreground)]">{errors.sku.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
              Nombre <span>*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Nombre del producto"
              disabled={isLoading}
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-[var(--admin-danger-foreground)]">{errors.nombre.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-[var(--color-brand-rose-dark)]/80 font-medium">
              Descripción <span>*</span>
            </Label>
            <Input
              id="descripcion"
              placeholder="Descripción del producto"
              disabled={isLoading}
              className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-xs text-[var(--admin-danger-foreground)]">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          {/* Categorías — Grid de Checkboxes */}
          <div className="space-y-2">
            <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">
              Categorías <span>*</span>
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
              <p className="text-xs text-[var(--admin-danger-foreground)]">
                {errors.categoriaIds.message}
              </p>
            )}
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">Imagen</Label>
            <div className="flex items-center gap-3">
              <Input
                id="imagen"
                type="text"
                value={imagenFile ? imagenFile.name : ""}
                placeholder="Seleccionar imagen"
                disabled
                className="flex-1"
              />
              <Label
                htmlFor="imagenUpload"
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--color-brand-mustard)] px-3 py-2 text-sm font-medium text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
              >
                <ImageIcon className="size-4" />
                Subir
              </Label>
              <input
                id="imagenUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImagenFile(e.target.files?.[0] ?? null)}
                disabled={isLoading}
              />
            </div>
            {previewUrl && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--admin-muted-foreground)]">
                  Nueva imagen:
                </p>
                <div className="w-32 h-32 relative rounded-lg overflow-hidden border border-[var(--admin-border)]">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {isEditing && producto?.imagenUrl && !imagenFile && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--admin-muted-foreground)]">
                  Imagen actual:
                </p>
                <div className="w-32 h-32 relative rounded-lg overflow-hidden border border-[var(--admin-border)]">
                  <Image
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-[var(--admin-muted-foreground)]">
                  Selecciona una nueva para reemplazarla.
                </p>
              </div>
            )}
          </div>

          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--admin-border)] shrink-0 bg-[var(--admin-card)] rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-[var(--color-brand-mustard)]/40 text-[var(--color-brand-mustard)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] disabled:opacity-50">
              {isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
