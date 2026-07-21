"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  ProductoComplementarioResponse,
  ProductoComplementarioRequest,
  ProductoResponse,
  CategoriaResponse,
  Sede,
} from "@/types";
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
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ComplementosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: number;
  productoNombre: string;
}

export function ComplementosDialog({
  isOpen,
  onClose,
  productoId,
  productoNombre,
}: ComplementosDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComplementarioId, setNewComplementarioId] = useState<string>("");
  const [newSedeId, setNewSedeId] = useState<string>("");
  const [newOrden, setNewOrden] = useState<number | "">("");

  const token = Cookies.get("token");

  const { data: complementos, error, mutate } = useSWR<ProductoComplementarioResponse[]>(
    isOpen ? `${API_URL}/api/superadmin/productos/${productoId}/complementos` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: productos } = useSWR<ProductoResponse[]>(
    isOpen ? `${API_URL}/api/superadmin/productos` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: categorias } = useSWR<CategoriaResponse[]>(
    isOpen ? `${API_URL}/api/superadmin/categorias` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: sedes } = useSWR<Sede[]>(
    isOpen ? `${API_URL}/api/superadmin/sedes` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const productosAdicionales = useMemo(() => {
    if (!productos || !categorias) return [];
    const adicionalCategoriaIds = new Set(
      categorias.filter((c) => c.tipo === "ADICIONAL").map((c) => c.id)
    );
    return productos.filter((p) =>
      p.categorias.some((cat) => adicionalCategoriaIds.has(cat.id))
    );
  }, [productos, categorias]);

  const complementariosIds = useMemo(
    () => new Set(complementos?.map((c) => c.complementarioId) ?? []),
    [complementos]
  );

  const productosDisponibles = useMemo(
    () => productosAdicionales.filter((p) => !complementariosIds.has(p.id) && p.id !== productoId),
    [productosAdicionales, complementariosIds, productoId]
  );

  const handleAdd = async () => {
    if (!newComplementarioId) {
      toast.error("Selecciona un producto complementario");
      return;
    }

    setIsLoading(true);
    try {
      const payload: ProductoComplementarioRequest = {
        complementarioId: Number(newComplementarioId),
        sedeId: newSedeId ? Number(newSedeId) : null,
        orden: typeof newOrden === "string" ? 0 : newOrden,
      };

      const res = await fetch(
        `${API_URL}/api/superadmin/productos/${productoId}/complementos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al agregar complemento");
      }

      toast.success("Complemento agregado correctamente");
      mutate();
      setShowAddForm(false);
      setNewComplementarioId("");
      setNewSedeId("");
      setNewOrden("");
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/productos/${productoId}/complementos/${id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al eliminar");
      }

      toast.success("Complemento eliminado");
      mutate();
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] border-t-4 border-t-[var(--admin-accent)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="border-b border-[var(--admin-border)] pb-4">
          <DialogTitle className="font-heading text-[var(--admin-foreground)]">
            Complementos de: {productoNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {complementos && complementos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--admin-canvas)]/60 hover:bg-[var(--admin-canvas)]/60">
                  <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Producto</TableHead>
                  <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Sede</TableHead>
                  <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Orden</TableHead>
                  <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complementos.map((comp) => (
                  <TableRow key={comp.id} className="border-[var(--admin-border)] hover:bg-[var(--admin-warning-soft)]/40 transition-colors">
                    <TableCell className="font-medium text-[var(--admin-foreground)]">
                      <div className="flex items-center gap-2">
                        {comp.complementarioImagenUrl && (
                          <Image
                            src={comp.complementarioImagenUrl}
                            alt={comp.complementarioNombre}
                            width={32}
                            height={32}
                            className="rounded-lg object-cover w-8 h-8 ring-1 ring-[var(--admin-border)]"
                          />
                        )}
                        <span>{comp.complementarioNombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--admin-muted-foreground)]">
                      {comp.sedeNombre || "Todas"}
                    </TableCell>
                    <TableCell className="text-[var(--admin-muted-foreground)]">{comp.orden}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comp.id)}
                        className="text-[var(--admin-danger-foreground)] hover:bg-[var(--admin-danger-soft)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-[var(--admin-muted-foreground)] text-center py-4 font-heading italic">
              No hay complementos curados para este producto.
            </p>
          )}

          {showAddForm ? (
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 space-y-4">
              <p className="font-heading font-semibold text-sm text-[var(--admin-foreground)]">Agregar complemento</p>

              <div className="space-y-2">
                <Label>Producto complementario</Label>
                <Select
                  value={newComplementarioId}
                  onValueChange={(v) => v && setNewComplementarioId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No hay productos adicionales disponibles
                      </SelectItem>
                    ) : (
                      productosDisponibles.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sede (opcional)</Label>
                <Select value={newSedeId} onValueChange={(v) => setNewSedeId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las sedes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las sedes</SelectItem>
                    {sedes?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  value={newOrden}
                  onChange={(e) => setNewOrden(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]"
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar complemento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
