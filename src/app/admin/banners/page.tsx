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
  ImageIcon,
  LoaderCircle,
} from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";
import { validateImageFile } from "@/lib/validation";
import { useRequireSuperAdmin } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const UBICACIONES: { value: UbicacionBanner; label: string }[] = [
  { value: "SELECTOR_SEDE", label: "Página de inicio" },
  { value: "HOME_SEDE", label: "Inicio de sede" },
  { value: "SHOWCASE", label: "Catálogo" },
];

const ORDINALES = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
const ORDEN_OPTIONS = ORDINALES.map((label, i) => ({ value: String(i), label }));
function ordenLabel(n: number) {
  return ORDINALES[n] ?? `${n}°`;
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
  const color = pct > 90 ? "text-[var(--admin-danger-foreground)]" : pct > 70 ? "text-[var(--admin-warning-foreground)]" : "text-[var(--admin-muted-foreground)]";
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
        sedeId: form.ubicacion === "SELECTOR_SEDE" || form.ubicacion === "SHOWCASE" ? null : form.sedeId,
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
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Banners Publicitarios"
        subtitle="Administra los banners y carruseles del sitio"
        icon={ImageIcon}
        actions={
          <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Banner
          </Button>
        }
      />

      {error && (
        <div className="border border-[var(--admin-danger)]/40 bg-[var(--admin-danger-soft)] text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg" role="alert">
          <p>Error al cargar banners: {error.message}</p>
        </div>
      )}

      {/* Filtros */}
      {banners && banners.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
            <Input
              placeholder="Buscar por título o texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroUbicacion} onValueChange={(v) => setFiltroUbicacion(v ?? "TODAS")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
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
        <p className="text-sm text-[var(--admin-muted-foreground)] font-heading italic">
          Mostrando {filteredBanners.length} de {banners.length} banners
        </p>
      )}

      {/* Grid de banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {!banners ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse border-[var(--admin-border)] bg-[var(--admin-card)]">
                <div className="aspect-[3/1] bg-[var(--admin-canvas)]" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--admin-canvas)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--admin-canvas)] rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-full">
            <AdminEmptyState
              icon={ImageIcon}
              title={banners.length === 0 ? "No hay banners creados" : "No se encontraron banners"}
              description={banners.length === 0 ? "Haz clic en \"Nuevo Banner\" para comenzar." : "Ajusta los filtros de búsqueda."}
              action={
                banners.length === 0 ? (
                  <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer banner
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden group bg-[var(--admin-card)] border-[var(--admin-border)] shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-[3/1] bg-[var(--admin-canvas)]">
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
                    <Trash2 className="h-3.5 w-3.5 text-[var(--admin-danger-foreground)]" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <StatusBadge
                    variant={banner.activo ? "success" : "muted"}
                    label={banner.activo ? "Activo" : "Inactivo"}
                  />
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-[var(--admin-foreground)] truncate font-heading">
                  {banner.titulo || "Sin título"}
                </h3>
                <p className="text-sm text-[var(--admin-muted-foreground)] mt-1">
                  {ubicacionLabel(banner.ubicacion)}
                  {banner.sedeId
                    ? ` · ${sedes?.find((s) => s.id === banner.sedeId)?.nombre ?? `Sede #${banner.sedeId}`}`
                    : " · Global"}
                </p>
                <p className="text-xs text-[var(--admin-muted-foreground)]/70 mt-1 font-heading">{ordenLabel(banner.orden)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col border-t-4 border-t-[var(--color-brand-rose)] border-b-4 border-b-[var(--color-brand-rose)] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="size-5 text-[var(--color-brand-mustard)]" />
              <DialogTitle className="text-[var(--color-brand-mustard)]">
                {editingBanner ? "Editar Banner" : "Nuevo Banner"}
              </DialogTitle>
            </div>
            <DialogDescription>
              Configura los datos del banner promocional
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
            {/* Ubicación */}
            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Ubicación</Label>
              <Select
                value={form.ubicacion}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    ubicacion: val as UbicacionBanner,
                    sedeId: val === "SELECTOR_SEDE" || val === "SHOWCASE" ? null : prev.sedeId,
                  }))
                }
              >
                <SelectTrigger id="ubicacion" className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                  <SelectValue placeholder="Selecciona una ubicación">
                    {UBICACIONES.find(u => u.value === form.ubicacion)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map((u) => (
                    <SelectItem key={u.value} value={u.value} label={u.label}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede (solo para HOME_SEDE) */}
            {form.ubicacion !== "SELECTOR_SEDE" && form.ubicacion !== "SHOWCASE" && (
              <div className="space-y-2">
                <Label htmlFor="sede" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Sede</Label>
                <Select
                  value={form.sedeId != null ? String(form.sedeId) : "global"}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, sedeId: val === "global" ? null : Number(val) }))
                  }
                >
                  <SelectTrigger id="sede" className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
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
              <Label htmlFor="titulo" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Colección Primavera"
                disabled={isLoading}
                maxLength={100}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              />
              <CharCounter current={form.titulo.length} max={100} />
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <Label htmlFor="texto" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Texto</Label>
              <Textarea
                id="texto"
                value={form.texto}
                onChange={(e) => setForm((prev) => ({ ...prev, texto: e.target.value }))}
                placeholder="Ej: Arreglos frescos para tu hogar"
                disabled={isLoading}
                rows={2}
                maxLength={255}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              />
              <CharCounter current={form.texto.length} max={255} />
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
                  onChange={handleImagenUpload}
                  disabled={isLoading || uploading}
                />
              </div>
              {uploading && <p className="text-xs text-[var(--admin-muted-foreground)]">Subiendo imagen...</p>}
              {form.imagenUrl && (
                <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]">
                  <Image
                    src={form.imagenUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-[var(--admin-muted-foreground)] mt-2">
                <strong>Tamaño recomendado:</strong> 1920 × 640 px (relación 3:1).
                Mantén el contenido importante en la zona central para evitar recortes en diferentes dispositivos.
              </p>
            </div>

            {/* Enlace */}
            <div className="space-y-2">
              <Label htmlFor="enlaceUrl" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Enlace (opcional)</Label>
              <Input
                id="enlaceUrl"
                value={form.enlaceUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, enlaceUrl: e.target.value }))}
                placeholder="/tienda/sede/1/producto/5"
                disabled={isLoading}
                maxLength={500}
                className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
              />
              <p className="text-xs text-[var(--admin-muted-foreground)]">
                Ruta interna o URL externa a donde llevará el banner al hacer click
              </p>
            </div>

            {/* Orden */}
            <div className="space-y-2">
              <Label htmlFor="orden" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Orden</Label>
              <Select
                value={String(form.orden)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, orden: v != null ? Number(v) : 0 }))}
                disabled={isLoading}
              >
                <SelectTrigger id="orden" className="w-48 focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                  <SelectValue placeholder="Selecciona el orden">
                    {ordenLabel(form.orden)}
                  </SelectValue>
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
              <Label htmlFor="activo" className="cursor-pointer text-[var(--color-brand-rose-dark)]/80 font-medium">Banner activo</Label>
            </div>
            </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--admin-border)] shrink-0 bg-[var(--admin-card)] rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
              className="border-[var(--color-brand-mustard)]/40 text-[var(--color-brand-mustard)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || uploading}
              className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : editingBanner ? (
                "Guardar Cambios"
              ) : (
                "Crear Banner"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
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
