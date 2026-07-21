"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ZonaDomicilioResponse, ZonaDomicilioRequest, Sede } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Pencil, Trash2, Search, LoaderCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/useAuthStore";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const normalizeText = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const zonaSchema = z.object({
  sedeId: z.number().min(1, "Seleccione una sede"),
  localidad: z.string().min(1, "La localidad es requerida"),
  barrio: z.string().optional(),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  excluido: z.boolean(),
});

type ZonaFormData = z.infer<typeof zonaSchema>;

export default function ZonasDomicilioPage() {
  const { rol, sedeId: adminSedeId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"todas" | "activas" | "excluidas">("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<ZonaDomicilioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localidadSearch, setLocalidadSearch] = useState("");
  const [localidadFocused, setLocalidadFocused] = useState(false);
  const [barrioSearch, setBarrioSearch] = useState("");
  const [barrioFocused, setBarrioFocused] = useState(false);
  const [zonaToDelete, setZonaToDelete] = useState<ZonaDomicilioResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ZonaFormData>({
    resolver: zodResolver(zonaSchema),
    defaultValues: {
      sedeId: adminSedeId ?? 0,
      localidad: "",
      barrio: "",
      precio: 0,
      excluido: false,
    },
  });

  useEffect(() => {
    const errorList = Object.values(errors);
    if (errorList.length > 0) {
      errorList.forEach((err) => {
        if (err?.message) {
          toast.error(err.message as string);
        }
      });
    }
  }, [errors]);

  const watchedSedeId = watch("sedeId");
  const watchedLocalidad = watch("localidad");

  useEffect(() => {
    setValue("localidad", "");
    setValue("barrio", "");
    setLocalidadSearch("");
    setBarrioSearch("");
  }, [watchedSedeId, setValue]);

  useEffect(() => {
    setValue("barrio", "");
    setBarrioSearch("");
  }, [watchedLocalidad, setValue]);

  const { data: sedes } = useSWR<Sede[]>(
    `${API_URL}/api/v1/sedes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const zonasUrl = rol === "SUPERADMIN"
    ? `${API_URL}/api/superadmin/zonas-domicilio`
    : `${API_URL}/api/admin/zonas-domicilio`;

  const { data: zonas, error, mutate } = useSWR<ZonaDomicilioResponse[]>(
    zonasUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const localidades = useMemo(() => {
    if (!zonas || !watchedSedeId) return [];
    const sedeZonas = zonas.filter((z) => z.sedeId === watchedSedeId);
    const unique = new Map<string, string>();
    for (const z of sedeZonas) {
      const key = normalizeText(z.localidad);
      if (!unique.has(key)) unique.set(key, z.localidad);
    }
    return [...unique.values()].sort();
  }, [zonas, watchedSedeId]);

  const barrios = useMemo(() => {
    if (!zonas || !watchedSedeId || !watchedLocalidad) return [];
    const filtered = zonas.filter(
      (z) => z.sedeId === watchedSedeId && z.localidad === watchedLocalidad
    );
    const unique = new Map<string, string>();
    for (const z of filtered) {
      if (!z.barrio) continue;
      const key = normalizeText(z.barrio);
      if (!unique.has(key)) unique.set(key, z.barrio);
    }
    return [...unique.values()].sort();
  }, [zonas, watchedSedeId, watchedLocalidad]);

  const filteredLocalidades = useMemo(() => {
    if (!localidadSearch) return localidades;
    return localidades.filter((loc) =>
      normalizeText(loc).includes(normalizeText(localidadSearch))
    );
  }, [localidades, localidadSearch]);

  const filteredBarrios = useMemo(() => {
    if (!barrioSearch) return barrios;
    return barrios.filter((bar) =>
      normalizeText(bar).includes(normalizeText(barrioSearch))
    );
  }, [barrios, barrioSearch]);

  useEffect(() => {
    if (dialogOpen) {
      if (editingZona) {
        reset({
          sedeId: editingZona.sedeId,
          localidad: editingZona.localidad,
          barrio: editingZona.barrio || "",
          precio: editingZona.precio,
          excluido: editingZona.excluido ?? false,
        });
      } else {
        reset({
          sedeId: adminSedeId ?? 0,
          localidad: "",
          barrio: "",
          precio: 0,
          excluido: false,
        });
      }
    }
  }, [dialogOpen, editingZona, reset, adminSedeId]);

  const handleNew = () => {
    setEditingZona(null);
    setDialogOpen(true);
  };

  const handleEdit = (zona: ZonaDomicilioResponse) => {
    setEditingZona(zona);
    setDialogOpen(true);
  };

  const onSubmit = async (data: ZonaFormData) => {
    setIsLoading(true);

    const token = Cookies.get("token");
    const isEditing = editingZona !== null;
    const baseEndpoint = rol === "SUPERADMIN" ? "superadmin" : "admin";
    const endpoint = isEditing
      ? `${API_URL}/api/${baseEndpoint}/zonas-domicilio/${editingZona.id}`
      : `${API_URL}/api/${baseEndpoint}/zonas-domicilio`;

    const payload: ZonaDomicilioRequest = {
      sedeId: data.sedeId,
      localidad: normalizeText(data.localidad),
      barrio: data.barrio ? normalizeText(data.barrio) : undefined,
      precio: data.precio,
      excluido: data.excluido ?? false,
    };

    try {
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
        throw new Error(errData.mensaje || errData.message || "Error al guardar la zona de domicilio");
      }

      toast.success(isEditing ? "Zona actualizada correctamente" : "Zona creada correctamente");
      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving zona:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (zona: ZonaDomicilioResponse) => {
    setZonaToDelete(zona);
  };

  const confirmDelete = async () => {
    if (!zonaToDelete) return;
    const zona = zonaToDelete;
    setZonaToDelete(null);

    const token = Cookies.get("token");
    const deleteUrl = rol === "SUPERADMIN"
      ? `${API_URL}/api/superadmin/zonas-domicilio/${zona.id}`
      : `${API_URL}/api/admin/zonas-domicilio/${zona.id}`;

    try {
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let errorMessage = "No se pudo eliminar la zona de domicilio.";
        try {
          const errData = await res.json();
          const raw = errData.mensaje || errData.message;
          if (raw) errorMessage = raw;
        } catch {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      toast.success("Zona eliminada correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting zona:", err);
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la zona.");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--admin-danger-soft)] border border-[var(--admin-danger)]/40 text-[var(--admin-danger-foreground)] px-4 py-3 rounded-lg">
          <p>Error al cargar las zonas de domicilio: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!zonas) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Cargando zonas de domicilio...
          </p>
        </div>
      </div>
    );
  }

  const sortedZonas = zonas ? [...zonas].sort((a, b) => b.id - a.id) : [];

  const countActivas = sortedZonas.filter((z) => !z.excluido).length;
  const countExcluidas = sortedZonas.filter((z) => z.excluido).length;

  const zonasFiltradas = sortedZonas
    .filter((z) => {
      if (estadoFilter === "activas") return !z.excluido;
      if (estadoFilter === "excluidas") return z.excluido;
      return true;
    })
    .filter((z) =>
      z.localidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.barrio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.id.toString().includes(searchTerm)
    );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Domicilios"
        subtitle="Gestiona las zonas y precios de domicilio"
        icon={MapPin}
        actions={
          <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Zona
          </Button>
        }
      />

      <AdminTableShell
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
              <Input
                type="text"
                placeholder="Buscar por localidad, barrio o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 bg-[var(--admin-canvas)] border border-[var(--admin-border)] rounded-lg p-1 w-fit">
              <button
                onClick={() => setEstadoFilter("todas")}
                className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
                  estadoFilter === "todas"
                    ? "bg-[var(--admin-accent)] text-[var(--admin-sidebar)] shadow-sm"
                    : "text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
                }`}
              >
                Todas <span className="ml-1 text-xs opacity-70">({sortedZonas.length})</span>
              </button>
              <button
                onClick={() => setEstadoFilter("activas")}
                className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
                  estadoFilter === "activas"
                    ? "bg-[var(--admin-accent)] text-[var(--admin-sidebar)] shadow-sm"
                    : "text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
                }`}
              >
                Activas <span className="ml-1 text-xs opacity-70">({countActivas})</span>
              </button>
              <button
                onClick={() => setEstadoFilter("excluidas")}
                className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
                  estadoFilter === "excluidas"
                    ? "bg-[var(--admin-accent)] text-[var(--admin-sidebar)] shadow-sm"
                    : "text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
                }`}
              >
                Excluidas <span className="ml-1 text-xs opacity-70">({countExcluidas})</span>
              </button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-canvas)]/60 hover:bg-[var(--admin-canvas)]/60">
              {rol === "SUPERADMIN" && <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Sede</TableHead>}
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Localidad / Municipio</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Barrio</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Precio</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Estado</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zonasFiltradas.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={rol === "SUPERADMIN" ? 6 : 5} className="p-0">
                  <AdminEmptyState
                    icon={MapPin}
                    title={
                      estadoFilter === "activas"
                        ? "No hay zonas activas"
                        : estadoFilter === "excluidas"
                          ? "No hay zonas excluidas"
                          : "No hay zonas de domicilio registradas"
                    }
                    description="Agrega zonas para definir la cobertura de envíos."
                  />
                </TableCell>
              </TableRow>
            )}
            {zonasFiltradas.map((zona) => (
              <TableRow key={zona.id} className="border-[var(--admin-border)] hover:bg-[var(--admin-warning-soft)]/40 transition-colors">
                {rol === "SUPERADMIN" && (
                  <TableCell className="text-[var(--admin-foreground)]">{sedes?.find(s => s.id === zona.sedeId)?.nombre || `Sede #${zona.sedeId}`}</TableCell>
                )}
                <TableCell className="font-medium text-[var(--admin-foreground)]">{zona.localidad}</TableCell>
                <TableCell className="text-[var(--admin-foreground)]">{zona.barrio || "-"}</TableCell>
                <TableCell className="text-[var(--admin-foreground)] font-semibold">{formatCurrency(zona.precio)}</TableCell>
                <TableCell>
                  {zona.excluido ? (
                    <StatusBadge variant="danger" label="Excluida" />
                  ) : (
                    <StatusBadge variant="success" label="Activa" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(zona)}
                      className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(zona)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col border-t-4 border-t-[var(--color-brand-rose)] border-b-4 border-b-[var(--color-brand-rose)] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="size-5 text-[var(--color-brand-mustard)]" />
              <DialogTitle className="text-[var(--color-brand-mustard)]">
                {editingZona ? "Editar Zona" : "Nueva Zona"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {editingZona ? "Actualiza los datos de la zona." : "Registra una nueva zona de domicilio."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              {rol === "SUPERADMIN" && (
                <div className="space-y-2">
                  <Label className="text-[var(--color-brand-rose-dark)]/80 font-medium">Sede *</Label>
                  <Controller
                    name="sedeId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value && field.value !== 0 ? field.value.toString() : ""}
                        onValueChange={(val) => { if (val && val !== "__none") field.onChange(Number(val)); }}
                      >
                        <SelectTrigger className="w-full focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                          {field.value && field.value !== 0 && sedes
                            ? (() => {
                                const sede = sedes.find((s) => s.id === field.value);
                                return sede ? `${sede.nombre} — ${sede.ciudad}` : null;
                              })()
                            : (
                              <SelectValue placeholder="Selecciona una sede" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Selecciona una sede...</SelectItem>
                          {sedes?.map((sede) => (
                            <SelectItem key={sede.id} value={sede.id.toString()}>
                              {sede.nombre} — {sede.ciudad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="localidad" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Localidad / Municipio *</Label>
                <div className="relative">
                  <Input
                    id="localidad"
                    value={watchedLocalidad ?? ""}
                    placeholder="Ej: Chía, Cundinamarca"
                    disabled={isLoading}
                    className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                    onFocus={() => setLocalidadFocused(true)}
                    onBlur={() => setTimeout(() => setLocalidadFocused(false), 200)}
                    onChange={(e) => {
                      setValue("localidad", e.target.value, { shouldValidate: true });
                      setLocalidadSearch(e.target.value);
                    }}
                  />
                  {localidadFocused && filteredLocalidades.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg shadow-md max-h-60 overflow-auto">
                      {filteredLocalidades.map((loc) => (
                        <div
                          key={loc}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--admin-warning-soft)] text-[var(--admin-foreground)]"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setValue("localidad", loc);
                            setLocalidadSearch("");
                            setLocalidadFocused(false);
                          }}
                        >
                          {loc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barrio" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Barrio (opcional)</Label>
                <div className="relative">
                  <Input
                    id="barrio"
                    value={watch("barrio") ?? ""}
                    placeholder="Dejar vacío para tarifa general"
                    disabled={isLoading}
                    className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                    onFocus={() => setBarrioFocused(true)}
                    onBlur={() => setTimeout(() => setBarrioFocused(false), 200)}
                    onChange={(e) => {
                      setValue("barrio", e.target.value, { shouldValidate: true });
                      setBarrioSearch(e.target.value);
                    }}
                  />
                  {barrioFocused && filteredBarrios.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-lg shadow-md max-h-60 overflow-auto">
                      {filteredBarrios.map((bar) => (
                        <div
                          key={bar}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--admin-warning-soft)] text-[var(--admin-foreground)]"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setValue("barrio", bar);
                            setBarrioSearch("");
                            setBarrioFocused(false);
                          }}
                        >
                          {bar}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Precio (COP) *</Label>
                <Input
                  id="precio"
                  type="number"
                  step="100"
                  {...register("precio", { valueAsNumber: true })}
                  placeholder="0"
                  disabled={isLoading}
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 bg-[var(--color-brand-rose)]/5 border-[var(--color-brand-rose)]/20">
                <div className="space-y-0.5">
                  <Label htmlFor="excluido" className="text-[var(--color-brand-rose-dark)]/80 font-medium cursor-pointer">
                    Zona excluida de domicilio
                  </Label>
                  <p className="text-xs text-[var(--admin-muted-foreground)]">
                    Si está activa, los clientes no podrán pagar con domicilio para esta zona
                  </p>
                </div>
                <Controller
                  name="excluido"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="excluido"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
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
              <Button type="submit" disabled={isLoading} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] disabled:opacity-50">
                {isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingZona ? (
                  "Guardar cambios"
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={zonaToDelete !== null} onOpenChange={(open) => { if (!open) setZonaToDelete(null); }}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
          <DialogHeader>
            <DialogTitle>Eliminar zona de domicilio</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la zona &ldquo;{zonaToDelete?.localidad}{zonaToDelete?.barrio ? ` - ${zonaToDelete.barrio}` : ""}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZonaToDelete(null)}>
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