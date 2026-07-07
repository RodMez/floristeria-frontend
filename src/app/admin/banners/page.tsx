"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, authFetch } from "@/lib/fetcher";
import { BannerDTO, BannerRequest, UbicacionBanner, Sede } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";
import { Textarea } from "@/components/ui/textarea";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const UBICACIONES: { value: UbicacionBanner; label: string }[] = [
  { value: "SELECTOR_SEDE", label: "Selector de Sede" },
  { value: "HOME_SEDE", label: "Home de Sede" },
  { value: "PRODUCTO_INDIVIDUAL", label: "Producto Individual" },
];

interface FormData {
  sedeId: number | null;
  ubicacion: UbicacionBanner;
  titulo: string;
  texto: string;
  imagenUrl: string;
  enlaceUrl: string;
  orden: number;
  activo: boolean;
}

const emptyForm: FormData = {
  sedeId: null,
  ubicacion: "HOME_SEDE",
  titulo: "",
  texto: "",
  imagenUrl: "",
  enlaceUrl: "",
  orden: 0,
  activo: true,
};

export default function BannersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDTO | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<BannerDTO | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: banners, error, mutate } = useSWR<BannerDTO[]>(
    `${API_URL}/api/admin/banners`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: sedes } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const resetForm = () => {
    setForm(emptyForm);
    setImagenFile(null);
  };

  const handleNew = () => {
    setEditingBanner(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (banner: BannerDTO) => {
    setEditingBanner(banner);
    setForm({
      sedeId: banner.sedeId,
      ubicacion: banner.ubicacion,
      titulo: banner.titulo ?? "",
      texto: banner.texto ?? "",
      imagenUrl: banner.imagenUrl,
      enlaceUrl: banner.enlaceUrl ?? "",
      orden: banner.orden,
      activo: banner.activo,
    });
    setImagenFile(null);
    setDialogOpen(true);
  };

  const handleDelete = (banner: BannerDTO) => {
    setBannerToDelete(banner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    const banner = bannerToDelete;
    setBannerToDelete(null);
    setDeleteDialogOpen(false);

    try {
      await authFetch(`${API_URL}/api/admin/banners/${banner.id}`, {
        method: "DELETE",
      });
      toast.success("Banner eliminado");
      mutate();
    } catch (err) {
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  const handleImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);

    setUploading(true);
    try {
      const token = Cookies.get("token");
      const formData = new FormData();
      formData.append("archivo", file);
      const res = await fetch(`${API_URL}/api/superadmin/imagenes`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir la imagen");
      const data = await res.json();
      setForm((prev) => ({ ...prev, imagenUrl: data.url }));
      toast.success("Imagen subida correctamente");
    } catch (err) {
      toast.error(`Error al subir imagen: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.imagenUrl) {
      toast.error("Debes subir una imagen para el banner");
      return;
    }

    setIsLoading(true);
    try {
      const payload: BannerRequest = {
        sedeId: form.ubicacion === "SELECTOR_SEDE" ? null : form.sedeId,
        ubicacion: form.ubicacion,
        titulo: form.titulo || undefined,
        texto: form.texto || undefined,
        imagenUrl: form.imagenUrl,
        enlaceUrl: form.enlaceUrl || undefined,
        orden: form.orden,
        activo: form.activo,
      };

      if (editingBanner) {
        await authFetch(`${API_URL}/api/admin/banners/${editingBanner.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Banner actualizado");
      } else {
        await authFetch(`${API_URL}/api/admin/banners`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Banner creado");
      }

      setDialogOpen(false);
      mutate();
    } catch (err) {
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ubicacionLabel = (u: string) => UBICACIONES.find((ub) => ub.value === u)?.label ?? u;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Banners Publicitarios</h1>
          <p className="mt-1 text-sm text-stone-500">
            Administra los banners y carruseles del sitio
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Banner
        </Button>
      </div>

      {error && (
        <div className="border border-red-400 bg-red-50 px-4 py-3 text-red-700 rounded-lg" role="alert">
          <p>Error al cargar banners: {error.message}</p>
        </div>
      )}

      {/* Lista de banners */}
      <div className="space-y-3">
        {!banners ? (
          <p className="text-stone-500 text-center py-8">Cargando banners...</p>
        ) : banners.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No hay banners creados. Haz clic en "Nuevo Banner" para comenzar.
          </p>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="flex items-stretch">
                {/* Preview imagen */}
                <div className="relative w-32 shrink-0 bg-stone-100">
                  <Image
                    src={banner.imagenUrl}
                    alt={banner.titulo ?? ""}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                {/* Info */}
                <CardContent className="flex flex-1 items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-stone-900 truncate">
                        {banner.titulo || "Sin título"}
                      </p>
                      {!banner.activo && (
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                          <EyeOff className="h-3 w-3" />
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">
                      {ubicacionLabel(banner.ubicacion)}
                      {banner.sedeId
                        ? ` · ${sedes?.find((s) => s.id === banner.sedeId)?.nombre ?? `Sede #${banner.sedeId}`}`
                        : " · Global"}
                    </p>
                    <p className="text-xs text-stone-400">Orden: {banner.orden}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Nuevo Banner"}</DialogTitle>
            <DialogDescription>
              Configura los datos del banner promocional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ubicación */}
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Select
                value={form.ubicacion}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    ubicacion: val as UbicacionBanner,
                    sedeId: val === "SELECTOR_SEDE" ? null : prev.sedeId,
                  }))
                }
              >
                <SelectTrigger id="ubicacion">
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede (solo si no es SELECTOR_SEDE) */}
            {form.ubicacion !== "SELECTOR_SEDE" && (
              <div className="space-y-2">
                <Label htmlFor="sede">Sede</Label>
                <Select
                  value={form.sedeId != null ? String(form.sedeId) : "global"}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, sedeId: val === "global" ? null : Number(val) }))
                  }
                >
                  <SelectTrigger id="sede">
                    <SelectValue placeholder="Global o específica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (todas las sedes)</SelectItem>
                    {sedes?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Colección Primavera"
                disabled={isLoading}
              />
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <Label htmlFor="texto">Texto</Label>
              <Textarea
                id="texto"
                value={form.texto}
                onChange={(e) => setForm((prev) => ({ ...prev, texto: e.target.value }))}
                placeholder="Ej: Arreglos frescos para tu hogar"
                disabled={isLoading}
                rows={2}
              />
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen</Label>
              <Input
                id="imagen"
                type="file"
                accept="image/*"
                onChange={handleImagenUpload}
                disabled={isLoading || uploading}
                className="file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--color-brand-mustard)] file:text-stone-900 file:cursor-pointer hover:file:bg-[var(--color-brand-mustard-dark)]"
              />
              {uploading && <p className="text-xs text-stone-500">Subiendo imagen...</p>}
              {form.imagenUrl && (
                <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                  <Image
                    src={form.imagenUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Enlace */}
            <div className="space-y-2">
              <Label htmlFor="enlaceUrl">Enlace (opcional)</Label>
              <Input
                id="enlaceUrl"
                value={form.enlaceUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, enlaceUrl: e.target.value }))}
                placeholder="/tienda/sede/1/producto/5"
                disabled={isLoading}
              />
              <p className="text-xs text-stone-500">
                Ruta interna o URL externa a donde llevará el banner al hacer click
              </p>
            </div>

            {/* Orden */}
            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min={0}
                value={form.orden}
                onChange={(e) => setForm((prev) => ({ ...prev, orden: parseInt(e.target.value) || 0 }))}
                disabled={isLoading}
                className="w-24"
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3">
              <Switch
                id="activo"
                checked={form.activo}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))}
              />
              <Label htmlFor="activo" className="cursor-pointer">Banner activo</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || uploading}>
              {isLoading ? "Guardando..." : editingBanner ? "Guardar Cambios" : "Crear Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Banner</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar "{bannerToDelete?.titulo || "este banner"}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
