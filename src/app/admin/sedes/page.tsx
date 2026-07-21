"use client";

import { useState, useDeferredValue, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, Plus, Pencil, Trash2, Search, LoaderCircle } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok, MdEmail } from "@/components/icons/SocialIcons";
import Cookies from "js-cookie";
import { z } from "zod";
import { useRequireSuperAdmin } from "@/lib/auth";
import { sanitizeUrl } from "@/lib/validation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const sedeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  telefonoWhatsapp: z.string().regex(
    /^\+57 3\d{2} \d{3} \d{4}$/,
    "Formato: +57 300 123 4567"
  ),
  instagramUrl: z.string().regex(
    /^https:\/\/(www\.)?instagram\.com(\/.*)?$/i,
    "Debe ser una URL de Instagram válida (ej: https://instagram.com/tu-cuenta)"
  ).optional().or(z.literal("")),
  facebookUrl: z.string().regex(
    /^https:\/\/(www\.|m\.|business\.)?(facebook|fb)\.com(\/.*)?$/i,
    "Debe ser una URL de Facebook válida (ej: https://facebook.com/tu-pagina)"
  ).optional().or(z.literal("")),
  tiktokUrl: z.string().regex(
    /^https:\/\/(www\.|vm\.|m\.)?tiktok\.com(\/.*)?$/i,
    "Debe ser una URL de TikTok válida (ej: https://tiktok.com/@tu-cuenta)"
  ).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
});

interface SedeForm {
  nombre: string;
  ciudad: string;
  telefonoWhatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  email: string;
}

const emptyForm: SedeForm = {
  nombre: "",
  ciudad: "",
  telefonoWhatsapp: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  email: "",
};

export default function SedesPage() {
  const { isLoading } = useRequireSuperAdmin();

  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDeferredValue(searchInput);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);

  const { data: sedes, error, mutate } = useSWR<Sede[]>(
    `${API_URL}/api/superadmin/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const validateField = (field: keyof SedeForm, value: string) => {
    const fieldSchema = z.object({ [field]: sedeSchema.shape[field] })
    const result = fieldSchema.safeParse({ [field]: value })
    setErrors(prev => ({
      ...prev,
      [field]: result.success ? "" : result.error.issues[0].message
    }))
  }

  const formatWhatsApp = (value: string): string => {
    let digits = value.replace(/\D/g, "")
    if (!digits.startsWith("57")) digits = "57" + digits.replace(/^57/, "")
    digits = digits.slice(0, 12)
    if (digits.length <= 2) return `+${digits}`
    if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }

  const handleNew = () => {
    setEditingSede(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'n' || e.key === 'N') && (e.metaKey || e.ctrlKey) && !dialogOpen) {
        e.preventDefault()
        handleNew()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dialogOpen])

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede);
    setForm({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      telefonoWhatsapp: sede.telefonoWhatsapp,
      instagramUrl: sede.instagramUrl || "",
      facebookUrl: sede.facebookUrl || "",
      tiktokUrl: sede.tiktokUrl || "",
      email: sede.email || "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = sedeSchema.safeParse(form);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      toast.error("Corrige los errores en el formulario antes de guardar");
      return;
    }

    setIsSubmitting(true);

    const token = Cookies.get("token");
    const isEditing = editingSede !== null;
    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/sedes/${editingSede.id}`
      : `${API_URL}/api/superadmin/sedes`;

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || errData.message || "Error al guardar la sede");
      }

      toast.success(isEditing ? "Sede actualizada correctamente" : "Sede creada correctamente");
      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving sede:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (sede: Sede) => {
    setSedeToDelete(sede);
  };

  const confirmDelete = async () => {
    if (!sedeToDelete) return;
    const sede = sedeToDelete;
    setSedeToDelete(null);

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/sedes/${sede.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        let errorMessage = "No se pudo eliminar la sede. Asegúrate de que no tenga productos o pedidos asociados.";
        try {
          const errData = await res.json();
          const raw = errData.mensaje || errData.message;
          if (raw && (raw.includes("restricción") || raw.includes("asociados") || raw.includes("constraint"))) {
            errorMessage = "No se pudo eliminar la sede porque tiene productos o pedidos asociados. Primero elimina estos elementos.";
          } else if (raw) {
            errorMessage = raw;
          }
        } catch {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
      toast.success("Sede eliminada correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting sede:", err);
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la sede.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg">
          <p>Error al cargar las sedes: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!sedes) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Cargando sedes...
          </p>
        </div>
      </div>
    );
  }

  // Filtro de búsqueda local
  const sedesFiltradas = (sedes ?? []).filter((s) =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telefonoWhatsapp.includes(searchTerm) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Sedes"
        subtitle="Gestiona las sedes de la floristería"
        icon={Building2}
        actions={
          <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sede
          </Button>
        }
      />

      {/* Buscador */}
      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
        <Input
          type="text"
          placeholder="Buscar (nombre, ciudad, WhatsApp, correo o ID)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de sedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {!sedes ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-[var(--admin-border)] bg-[var(--admin-card)]">
                <div className="h-1.5 bg-[var(--admin-accent)] rounded-t-lg" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-[var(--admin-canvas)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--admin-canvas)] rounded w-1/2" />
                  <div className="h-8 bg-[var(--admin-canvas)] rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : sedesFiltradas.length === 0 ? (
          <div className="col-span-full">
            <AdminEmptyState
              icon={Building2}
              title={sedes.length === 0 ? "No hay sedes registradas" : "No se encontraron sedes"}
              description={sedes.length === 0 ? "Crea tu primera sede para empezar a vender." : "Ajusta los filtros de búsqueda."}
              action={
                sedes.length === 0 ? (
                  <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera sede
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          sedesFiltradas.map((sede) => (
            <Card key={sede.id} className="overflow-hidden group bg-[var(--admin-card)] border-[var(--admin-border)] border-t-4 border-t-[var(--color-brand-rose)] hover:border-t-[var(--admin-accent)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-semibold text-base text-[var(--admin-foreground)] group-hover:text-[var(--admin-accent)] truncate transition-colors duration-300">
                      {sede.nombre}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-heading font-medium bg-[var(--color-brand-rose)]/20 text-[var(--color-brand-rose-dark)]">
                        {sede.ciudad}
                      </span>
                      {sede.email && (
                        <a href={`mailto:${sede.email}`} className="inline-flex items-center gap-1 text-xs text-[var(--admin-muted-foreground)] hover:text-[var(--color-brand-rose-dark)] transition-colors">
                          <MdEmail className="h-3 w-3" />
                          {sede.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                      onClick={() => handleEdit(sede)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                      onClick={() => handleDelete(sede)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[var(--admin-danger-foreground)]" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-dashed border-[var(--admin-border)]">
                  {sede.telefonoWhatsapp && (
                    <a
                      href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 group/icon"
                      title={`WhatsApp: ${sede.telefonoWhatsapp}`}
                    >
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#25D366] text-white hover:brightness-110 transition-all">
                        <FaWhatsapp className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-heading text-[var(--admin-muted-foreground)] group-hover/icon:text-[#25D366] transition-colors">WhatsApp</span>
                    </a>
                  )}
                  {sede.instagramUrl && (
                    <a
                      href={sanitizeUrl(sede.instagramUrl ?? "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 group/icon"
                      title="Instagram"
                    >
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#E4405F] text-white hover:brightness-110 transition-all">
                        <FaInstagram className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-heading text-[var(--admin-muted-foreground)] group-hover/icon:text-[#E4405F] transition-colors">Instagram</span>
                    </a>
                  )}
                  {sede.facebookUrl && (
                    <a
                      href={sanitizeUrl(sede.facebookUrl ?? "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 group/icon"
                      title="Facebook"
                    >
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#1877F2] text-white hover:brightness-110 transition-all">
                        <FaFacebook className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-heading text-[var(--admin-muted-foreground)] group-hover/icon:text-[#1877F2] transition-colors">Facebook</span>
                    </a>
                  )}
                  {sede.tiktokUrl && (
                    <a
                      href={sanitizeUrl(sede.tiktokUrl ?? "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 group/icon"
                      title="TikTok"
                    >
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#000000] text-white hover:brightness-110 transition-all">
                        <FaTiktok className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-heading text-[var(--admin-muted-foreground)] group-hover/icon:text-[#000000] transition-colors">TikTok</span>
                    </a>
                  )}
                  {!sede.telefonoWhatsapp && !sede.instagramUrl && !sede.facebookUrl && !sede.tiktokUrl && (
                    <span className="text-[var(--admin-muted-foreground)] text-xs italic">Sin contacto</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col border-t-4 border-t-[var(--color-brand-rose)] border-b-4 border-b-[var(--color-brand-rose)] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="size-5 text-[var(--color-brand-mustard)]" />
              <DialogTitle className="text-[var(--color-brand-mustard)]">
                {editingSede ? "Editar Sede" : "Nueva Sede"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {editingSede ? "Actualiza los datos de la sede." : "Registra una nueva sede."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => {
                    setForm({ ...form, nombre: e.target.value })
                    validateField("nombre", e.target.value)
                  }}
                  placeholder="Nombre de la sede"
                  disabled={isSubmitting}
                  required
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? "error-nombre" : undefined}
                />
                {errors.nombre && (
                  <span id="error-nombre" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.nombre}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={form.ciudad}
                  onChange={(e) => {
                    setForm({ ...form, ciudad: e.target.value })
                    validateField("ciudad", e.target.value)
                  }}
                  placeholder="Ciudad"
                  disabled={isSubmitting}
                  required
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.ciudad}
                  aria-describedby={errors.ciudad ? "error-ciudad" : undefined}
                />
                {errors.ciudad && (
                  <span id="error-ciudad" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.ciudad}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonoWhatsapp" className="text-[var(--color-brand-rose-dark)]/80 font-medium">WhatsApp</Label>
                <Input
                  id="telefonoWhatsapp"
                  value={form.telefonoWhatsapp}
                  onChange={(e) => {
                    const formatted = formatWhatsApp(e.target.value)
                    setForm({ ...form, telefonoWhatsapp: formatted })
                    validateField("telefonoWhatsapp", formatted)
                  }}
                  placeholder="+57 300 123 4567"
                  disabled={isSubmitting}
                  required
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.telefonoWhatsapp}
                  aria-describedby={errors.telefonoWhatsapp ? "error-telefonoWhatsapp" : undefined}
                />
                {errors.telefonoWhatsapp && (
                  <span id="error-telefonoWhatsapp" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.telefonoWhatsapp}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Instagram URL (opcional)</Label>
                <Input
                  id="instagramUrl"
                  value={form.instagramUrl}
                  onChange={(e) => {
                    setForm({ ...form, instagramUrl: e.target.value })
                    validateField("instagramUrl", e.target.value)
                  }}
                  placeholder="https://instagram.com/tu-sede"
                  disabled={isSubmitting}
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.instagramUrl}
                  aria-describedby={errors.instagramUrl ? "error-instagramUrl" : undefined}
                />
                {errors.instagramUrl && (
                  <span id="error-instagramUrl" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.instagramUrl}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Facebook URL (opcional)</Label>
                <Input
                  id="facebookUrl"
                  value={form.facebookUrl}
                  onChange={(e) => {
                    setForm({ ...form, facebookUrl: e.target.value })
                    validateField("facebookUrl", e.target.value)
                  }}
                  placeholder="https://facebook.com/tu-sede"
                  disabled={isSubmitting}
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.facebookUrl}
                  aria-describedby={errors.facebookUrl ? "error-facebookUrl" : undefined}
                />
                {errors.facebookUrl && (
                  <span id="error-facebookUrl" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.facebookUrl}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl" className="text-[var(--color-brand-rose-dark)]/80 font-medium">TikTok URL (opcional)</Label>
                <Input
                  id="tiktokUrl"
                  value={form.tiktokUrl}
                  onChange={(e) => {
                    setForm({ ...form, tiktokUrl: e.target.value })
                    validateField("tiktokUrl", e.target.value)
                  }}
                  placeholder="https://tiktok.com/@tu-sede"
                  disabled={isSubmitting}
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.tiktokUrl}
                  aria-describedby={errors.tiktokUrl ? "error-tiktokUrl" : undefined}
                />
                {errors.tiktokUrl && (
                  <span id="error-tiktokUrl" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.tiktokUrl}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Correo electrónico (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value })
                    validateField("email", e.target.value)
                  }}
                  placeholder="sede@floristeria.com"
                  disabled={isSubmitting}
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "error-email" : undefined}
                />
                {errors.email && (
                  <span id="error-email" className="text-xs text-[var(--admin-danger-foreground)]" role="alert">{errors.email}</span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--admin-border)] shrink-0 bg-[var(--admin-card)] rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
                className="border-[var(--color-brand-mustard)]/40 text-[var(--color-brand-mustard)] hover:bg-[var(--color-brand-mustard)]/10 hover:border-[var(--color-brand-mustard)]"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingSede ? (
                  "Guardar cambios"
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sedeToDelete !== null} onOpenChange={(open) => { if (!open) setSedeToDelete(null); }}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
          <DialogHeader>
            <DialogTitle>Eliminar sede</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la sede &ldquo;{sedeToDelete?.nombre}&rdquo; en {sedeToDelete?.ciudad}? Esta acción es irreversible y ocultará la sede, su inventario, usuarios y zonas de domicilio asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSedeToDelete(null)}>
              No, volver
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
