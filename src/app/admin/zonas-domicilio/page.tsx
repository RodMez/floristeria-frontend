"use client";

import { useState, useEffect } from "react";
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
import { MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const zonaSchema = z.object({
  sedeId: z.number().min(1, "Seleccione una sede"),
  localidad: z.string().min(1, "La localidad es requerida"),
  barrio: z.string().optional(),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

type ZonaFormData = z.infer<typeof zonaSchema>;

export default function ZonasDomicilioPage() {
  const { rol, sedeId: adminSedeId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<ZonaDomicilioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ZonaFormData>({
    resolver: zodResolver(zonaSchema),
    defaultValues: {
      sedeId: adminSedeId ?? 0,
      localidad: "",
      barrio: "",
      precio: 0,
    },
  });

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

  useEffect(() => {
    if (dialogOpen) {
      if (editingZona) {
        reset({
          sedeId: editingZona.sedeId,
          localidad: editingZona.localidad,
          barrio: editingZona.barrio || "",
          precio: editingZona.precio,
        });
      } else {
        reset({
          sedeId: adminSedeId ?? 0,
          localidad: "",
          barrio: "",
          precio: 0,
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
      localidad: data.localidad,
      barrio: data.barrio || undefined,
      precio: data.precio,
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
        throw new Error(errData.message || "Error al guardar la zona de domicilio");
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

  const handleDelete = async (zona: ZonaDomicilioResponse) => {
    const nombreZona = `${zona.localidad}${zona.barrio ? ` - ${zona.barrio}` : ""}`;
    if (!window.confirm(`¿Eliminar la zona "${nombreZona}"?`)) return;

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar las zonas de domicilio: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!zonas) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando zonas de domicilio...</p>
        </div>
      </div>
    );
  }

  const sortedZonas = zonas ? [...zonas].sort((a, b) => b.id - a.id) : [];

  const zonasFiltradas = sortedZonas.filter((z) =>
    z.localidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.barrio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Domicilios</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gestiona las zonas y precios de domicilio
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Zona
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar por localidad, barrio o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {rol === "SUPERADMIN" && <TableHead>Sede</TableHead>}
              <TableHead>Localidad / Municipio</TableHead>
              <TableHead>Barrio</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zonasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={rol === "SUPERADMIN" ? 5 : 4} className="text-center text-stone-500 py-8">
                  No hay zonas de domicilio registradas
                </TableCell>
              </TableRow>
            )}
            {zonasFiltradas.map((zona) => (
              <TableRow key={zona.id}>
                {rol === "SUPERADMIN" && (
                  <TableCell>{sedes?.find(s => s.id === zona.sedeId)?.nombre || `Sede #${zona.sedeId}`}</TableCell>
                )}
                <TableCell className="font-medium">{zona.localidad}</TableCell>
                <TableCell>{zona.barrio || "-"}</TableCell>
                <TableCell>{formatCurrency(zona.precio)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(zona)}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZona ? "Editar Zona" : "Nueva Zona"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {rol === "SUPERADMIN" && (
              <div className="space-y-2">
                <Label>Sede *</Label>
                <Controller
                  name="sedeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                      <SelectContent>
                        {sedes?.map((sede) => (
                          <SelectItem key={sede.id} value={sede.id.toString()}>
                            {sede.nombre} — {sede.ciudad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sedeId && (
                  <p className="text-xs text-red-500">{errors.sedeId.message}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad / Municipio *</Label>
              <Input
                id="localidad"
                {...register("localidad")}
                placeholder="Ej: Chía, Cundinamarca"
                disabled={isLoading}
              />
              {errors.localidad && (
                <p className="text-xs text-red-500">{errors.localidad.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barrio">Barrio (opcional)</Label>
              <Input
                id="barrio"
                {...register("barrio")}
                placeholder="Dejar vacío para tarifa general"
                disabled={isLoading}
              />
              {errors.barrio && (
                <p className="text-xs text-red-500">{errors.barrio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (COP) *</Label>
              <Input
                id="precio"
                type="number"
                step="100"
                {...register("precio")}
                placeholder="0"
                disabled={isLoading}
              />
              {errors.precio && (
                <p className="text-xs text-red-500">{errors.precio.message}</p>
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
    </div>
  );
}