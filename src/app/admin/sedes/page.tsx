"use client";

import { useState, useDeferredValue, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Cookies from "js-cookie";
import { z } from "zod";

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
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDeferredValue(searchInput);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);
  const [sortField, setSortField] = useState<string | null>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

    setIsLoading(true);

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
      setIsLoading(false);
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

  const handleSort = (field: string) => {
    setSortDir(prev => (sortField === field ? (prev === "asc" ? "desc" : "asc") : "desc"))
    setSortField(field)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar las sedes: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!sedes) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  // Ordenamiento por columna
  const sortedSedes = [...(sedes ?? [])].sort((a, b) => {
    let cmp = 0
    if (sortField === "id") cmp = a.id - b.id
    else if (sortField === "nombre") cmp = a.nombre.localeCompare(b.nombre)
    else if (sortField === "ciudad") cmp = a.ciudad.localeCompare(b.ciudad)
    else cmp = a.id - b.id
    return sortDir === "asc" ? cmp : -cmp
  });

  // Filtro de búsqueda local (usando deferred value)
  const sedesFiltradas = sortedSedes.filter((s) =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telefonoWhatsapp.includes(searchTerm) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Sedes</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona las sedes de la floristería
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sede
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar (nombre, ciudad, WhatsApp, correo o ID)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("id")}
                aria-sort={sortField === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                ID {sortField === "id" && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("nombre")}
                aria-sort={sortField === "nombre" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                Nombre {sortField === "nombre" && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("ciudad")}
                aria-sort={sortField === "ciudad" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                Ciudad {sortField === "ciudad" && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sedesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-stone-500 py-8">
                  No hay sedes registradas
                </TableCell>
              </TableRow>
            )}
            {sedesFiltradas.map((sede) => (
              <TableRow key={sede.id}>
                <TableCell>{sede.id}</TableCell>
                <TableCell className="font-medium">{sede.nombre}</TableCell>
                <TableCell>{sede.ciudad}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sede.telefonoWhatsapp && (
                      <a
                        href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        title={`WhatsApp: ${sede.telefonoWhatsapp}`}
                      >
                        <FaWhatsapp className="h-4 w-4" />
                      </a>
                    )}
                    {sede.instagramUrl && (
                      <a
                        href={sede.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                        title="Instagram"
                      >
                        <FaInstagram className="h-4 w-4" />
                      </a>
                    )}
                    {sede.facebookUrl && (
                      <a
                        href={sede.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Facebook"
                      >
                        <FaFacebook className="h-4 w-4" />
                      </a>
                    )}
                    {sede.tiktokUrl && (
                      <a
                        href={sede.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors"
                        title="TikTok"
                      >
                        <FaTiktok className="h-4 w-4" />
                      </a>
                    )}
                    {sede.email && (
                      <a
                        href={`mailto:${sede.email}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                        title={`Correo: ${sede.email}`}
                      >
                        <MdEmail className="h-4 w-4" />
                      </a>
                    )}
                    {!sede.telefonoWhatsapp && !sede.instagramUrl && !sede.facebookUrl && !sede.tiktokUrl && !sede.email && (
                      <span className="text-stone-400 text-sm">Sin contacto</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(sede)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sede)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSede ? "Editar Sede" : "Nueva Sede"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value })
                  validateField("nombre", e.target.value)
                }}
                placeholder="Nombre de la sede"
                disabled={isLoading}
                required
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? "error-nombre" : undefined}
              />
              {errors.nombre && (
                <span id="error-nombre" className="text-xs text-red-500" role="alert">{errors.nombre}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={form.ciudad}
                onChange={(e) => {
                  setForm({ ...form, ciudad: e.target.value })
                  validateField("ciudad", e.target.value)
                }}
                placeholder="Ciudad"
                disabled={isLoading}
                required
                aria-invalid={!!errors.ciudad}
                aria-describedby={errors.ciudad ? "error-ciudad" : undefined}
              />
              {errors.ciudad && (
                <span id="error-ciudad" className="text-xs text-red-500" role="alert">{errors.ciudad}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefonoWhatsapp">WhatsApp</Label>
              <Input
                id="telefonoWhatsapp"
                value={form.telefonoWhatsapp}
                onChange={(e) => {
                  const formatted = formatWhatsApp(e.target.value)
                  setForm({ ...form, telefonoWhatsapp: formatted })
                  validateField("telefonoWhatsapp", formatted)
                }}
                placeholder="+57 300 123 4567"
                disabled={isLoading}
                required
                aria-invalid={!!errors.telefonoWhatsapp}
                aria-describedby={errors.telefonoWhatsapp ? "error-telefonoWhatsapp" : undefined}
              />
              {errors.telefonoWhatsapp && (
                <span id="error-telefonoWhatsapp" className="text-xs text-red-500" role="alert">{errors.telefonoWhatsapp}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL (opcional)</Label>
              <Input
                id="instagramUrl"
                value={form.instagramUrl}
                onChange={(e) => {
                  setForm({ ...form, instagramUrl: e.target.value })
                  validateField("instagramUrl", e.target.value)
                }}
                placeholder="https://instagram.com/tu-sede"
                disabled={isLoading}
                aria-invalid={!!errors.instagramUrl}
                aria-describedby={errors.instagramUrl ? "error-instagramUrl" : undefined}
              />
              {errors.instagramUrl && (
                <span id="error-instagramUrl" className="text-xs text-red-500" role="alert">{errors.instagramUrl}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL (opcional)</Label>
              <Input
                id="facebookUrl"
                value={form.facebookUrl}
                onChange={(e) => {
                  setForm({ ...form, facebookUrl: e.target.value })
                  validateField("facebookUrl", e.target.value)
                }}
                placeholder="https://facebook.com/tu-sede"
                disabled={isLoading}
                aria-invalid={!!errors.facebookUrl}
                aria-describedby={errors.facebookUrl ? "error-facebookUrl" : undefined}
              />
              {errors.facebookUrl && (
                <span id="error-facebookUrl" className="text-xs text-red-500" role="alert">{errors.facebookUrl}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktokUrl">TikTok URL (opcional)</Label>
              <Input
                id="tiktokUrl"
                value={form.tiktokUrl}
                onChange={(e) => {
                  setForm({ ...form, tiktokUrl: e.target.value })
                  validateField("tiktokUrl", e.target.value)
                }}
                placeholder="https://tiktok.com/@tu-sede"
                disabled={isLoading}
                aria-invalid={!!errors.tiktokUrl}
                aria-describedby={errors.tiktokUrl ? "error-tiktokUrl" : undefined}
              />
              {errors.tiktokUrl && (
                <span id="error-tiktokUrl" className="text-xs text-red-500" role="alert">{errors.tiktokUrl}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value })
                  validateField("email", e.target.value)
                }}
                placeholder="sede@floristeria.com"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "error-email" : undefined}
              />
              {errors.email && (
                <span id="error-email" className="text-xs text-red-500" role="alert">{errors.email}</span>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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

      <Dialog open={sedeToDelete !== null} onOpenChange={(open) => { if (!open) setSedeToDelete(null); }}>
        <DialogContent>
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
