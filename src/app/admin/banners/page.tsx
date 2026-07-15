"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher, authFetch } from "@/lib/fetcher";
import { BannerDTO, BannerRequest, UbicacionBanner, Sede } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";
import { validateImageFile } from "@/lib/validation";
import { useRequireSuperAdmin } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const UBICACIONES: { value: UbicacionBanner; label: string }[] = [
  { value: "SELECTOR_SEDE", label: "Página de inicio" },
  { value: "HOME_SEDE", label: "Inicio de sede" },
  { value: "PRODUCTO_INDIVIDUAL", label: "Página de producto" },
];

const ORDINALES = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
const ORDEN_OPTIONS = ORDINALES.map((label, i) => ({ value: String(i), label }));
function ordenLabel(n: number) {
  if (n === 0) return "0°";
  return ORDINALES[n - 1] ?? `${n}°`;
}

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

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct > 90 ? "text-red-500" : pct > 70 ? "text-amber-500" : "text-stone-400";
  return (
    <p className={`text-xs text-right ${color}`}>
      {current}/{max}
    </p>
  );
}

export default function BannersPage() {
  const { isLoading: isAuthLoading } = useRequireSuperAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDTO | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<BannerDTO | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>("TODAS");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

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

  const filteredBanners = useMemo(() => {
    if (!banners) return [];
    return banners.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.texto?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUbicacion =
        filtroUbicacion === "TODAS" || b.ubicacion === filtroUbicacion;
      const matchEstado =
        filtroEstado === "TODOS" ||
        (filtroEstado === "ACTIVOS" && b.activo) ||
        (filtroEstado === "INACTIVOS" && !b.activo);
      return matchSearch && matchUbicacion && matchEstado;
    });
  }, [banners, searchTerm, filtroUbicacion, filtroEstado]);

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

    const fileError = validateImageFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }

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

    if (form.titulo.length > 100) {
      toast.error("El título no puede exceder 100 caracteres");
      return;
    }

    if (form.texto.length > 255) {
      toast.error("El texto no puede exceder 255 caracteres");
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

  if (isAuthLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-stone-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filtros */}
      {banners && banners.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Buscar por título o texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroUbicacion} onValueChange={(v) => setFiltroUbicacion(v ?? "TODAS")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-stone-400" />
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las ubicaciones</SelectItem>
              {UBICACIONES.map((u) => (
                <SelectItem key={u.value} value={u.value} label={u.label}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? "TODOS")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ACTIVOS">Activos</SelectItem>
              <SelectItem value="INACTIVOS">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Contador de resultados */}
      {banners && banners.length > 0 && (
        <p className="text-sm text-stone-500">
          Mostrando {filteredBanners.length} de {banners.length} banners
        </p>
      )}

      {/* Grid de banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {!banners ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-[3/1] bg-stone-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-stone-500">
              {banners.length === 0
                ? 'No hay banners creados. Haz clic en "Nuevo Banner" para comenzar.'
                : "No se encontraron banners con los filtros seleccionados."}
            </p>
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden group">
              <div className="relative aspect-[3/1] bg-stone-100">
                <Image
                  src={banner.imagenUrl}
                  alt={banner.titulo ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={() => handleEdit(banner)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={() => handleDelete(banner)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant={banner.activo ? "default" : "secondary"}
                    className={banner.activo
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-100"
                    }
                  >
                    {banner.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-stone-900 truncate">
                  {banner.titulo || "Sin título"}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {ubicacionLabel(banner.ubicacion)}
                  {banner.sedeId
                    ? ` · ${sedes?.find((s) => s.id === banner.sedeId)?.nombre ?? `Sede #${banner.sedeId}`}`
                    : " · Global"}
                </p>
                <p className="text-xs text-stone-400 mt-1">{ordenLabel(banner.orden)}</p>
              </CardContent>
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
                    <SelectItem key={u.value} value={u.value} label={u.label}>{u.label}</SelectItem>
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
                      <SelectItem key={s.id} value={String(s.id)} label={s.nombre}>{s.nombre}</SelectItem>
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
                maxLength={100}
              />
              <CharCounter current={form.titulo.length} max={100} />
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
                maxLength={255}
              />
              <CharCounter current={form.texto.length} max={255} />
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
              <p className="text-xs text-stone-500 mt-2">
                <strong>Tamaño recomendado:</strong> 1920 × 640 px (relación 3:1).
                Mantén el contenido importante en la zona central para evitar recortes en diferentes dispositivos.
              </p>
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
                maxLength={500}
              />
              <p className="text-xs text-stone-500">
                Ruta interna o URL externa a donde llevará el banner al hacer click
              </p>
            </div>

            {/* Orden */}
            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Select
                value={String(form.orden)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, orden: v != null ? Number(v) : 0 }))}
                disabled={isLoading}
              >
                <SelectTrigger id="orden" className="w-48">
                  <SelectValue placeholder="Selecciona el orden" />
                </SelectTrigger>
                <SelectContent>
                  {ORDEN_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              ¿Estás seguro de eliminar &quot;{bannerToDelete?.titulo || "este banner"}&quot;? Esta acción no se puede deshacer.
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
