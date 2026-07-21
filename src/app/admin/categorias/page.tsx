"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CategoriaResponse, CategoriaRequest } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tags, Plus, Pencil, Trash2, Search, LoaderCircle } from "lucide-react";
import Cookies from "js-cookie";
import { useRequireSuperAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ORDINALES = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
const ORDEN_OPTIONS = ORDINALES.map((label, i) => ({ value: String(i), label }));
function ordenLabel(n: number) {
  return ORDINALES[n] ?? `${n}°`;
}

export default function CategoriasPage() {
  const { isLoading: isCheckingPermissions } = useRequireSuperAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaResponse | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("CATALOGO");
  const [mostrarEnCatalogo, setMostrarEnCatalogo] = useState(true);
  const [orden, setOrden] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaResponse | null>(null);

  const { data: categorias, error, mutate } = useSWR<CategoriaResponse[]>(
    `${API_URL}/api/superadmin/categorias`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleNew = () => {
    setEditingCategoria(null);
    setNombre("");
    setTipo("CATALOGO");
    setMostrarEnCatalogo(true);
    setOrden("");
    setDialogOpen(true);
  };

  const handleEdit = (categoria: CategoriaResponse) => {
    setEditingCategoria(categoria);
    setNombre(categoria.nombre);
    setTipo(categoria.tipo || "CATALOGO");
    setMostrarEnCatalogo(categoria.mostrarEnCatalogo ?? true);
    setOrden(categoria.orden ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const token = Cookies.get("token");
    const payload: CategoriaRequest = {
      nombre,
      tipo,
      mostrarEnCatalogo,
      orden: typeof orden === "string" ? 0 : orden,
    };
    const isEditing = editingCategoria !== null;
    const endpoint = isEditing
      ? `${API_URL}/api/superadmin/categorias/${editingCategoria.id}`
      : `${API_URL}/api/superadmin/categorias`;

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
        throw new Error(errData.message || "Error al guardar la categoría");
      }

      toast.success(isEditing ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
      mutate();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (categoria: CategoriaResponse) => {
    setCategoriaToDelete(categoria);
  };

  const confirmDelete = async () => {
    if (!categoriaToDelete) return;
    const categoria = categoriaToDelete;
    setCategoriaToDelete(null);

    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/api/superadmin/categorias/${categoria.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || errData.message || "Error al eliminar");
      }
      toast.success("Categoría eliminada correctamente");
      mutate();
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  if (isCheckingPermissions) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Tags className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
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
          <p>Error al cargar las categorías: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!categorias) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Tags className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
          <p className="font-heading italic text-[var(--admin-muted-foreground)]">
            Cargando categorías...
          </p>
        </div>
      </div>
    );
  }

  const sortedCategorias = categorias ? [...categorias].sort((a, b) => b.id - a.id) : [];

  const categoriasFiltradas = sortedCategorias.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Categorías"
        subtitle="Gestiona las categorías de productos"
        icon={Tags}
        actions={
          <Button onClick={handleNew} className="bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        }
      />

      <AdminTableShell
        toolbar={
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-muted-foreground)]" />
            <Input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-canvas)]/60 hover:bg-[var(--admin-canvas)]/60">
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">ID</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Nombre</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Tipo</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Catálogo</TableHead>
              <TableHead className="font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Orden</TableHead>
              <TableHead className="text-right font-heading uppercase tracking-wider text-[var(--admin-muted-foreground)] text-[11px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriasFiltradas.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <AdminEmptyState
                    icon={Tags}
                    title="No hay categorías registradas"
                    description="Crea tu primera categoría para organizar el catálogo."
                  />
                </TableCell>
              </TableRow>
            )}
            {categoriasFiltradas.map((categoria) => (
              <TableRow key={categoria.id} className="border-[var(--admin-border)] hover:bg-[var(--admin-warning-soft)]/40 transition-colors">
                <TableCell className="text-[var(--admin-muted-foreground)]">{categoria.id}</TableCell>
                <TableCell className="font-medium text-[var(--admin-foreground)]">{categoria.nombre}</TableCell>
                <TableCell>
                  {categoria.tipo === "ADICIONAL" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-heading tracking-wide bg-transparent text-[var(--admin-info-foreground)] border-[var(--admin-info)]/30">
                      <span className="size-1.5 rounded-full bg-[var(--admin-info-foreground)]" />
                      ADICIONAL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold text-[var(--admin-accent-hover)] border-[var(--admin-accent-hover)]/30">
                      <span className="size-1.5 rounded-full bg-[var(--admin-accent-hover)]" />
                      CATÁLOGO
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {(categoria.mostrarEnCatalogo ?? true) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-heading tracking-wide bg-transparent text-[var(--admin-success-foreground)] border-[var(--admin-success)]/30">
                      <span className="size-1.5 rounded-full bg-[var(--admin-success-foreground)]" />
                      Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-heading italic tracking-wide bg-transparent text-[var(--admin-info-foreground)] border-[var(--admin-info)]/30">
                      <span className="size-1.5 rounded-full bg-[var(--admin-info-foreground)]" />
                      Oculto
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-[var(--admin-muted-foreground)]">{ordenLabel(categoria.orden ?? 0)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(categoria)}
                      className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] hover:bg-[var(--admin-warning-soft)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(categoria)}
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
              <Tags className="size-5 text-[var(--color-brand-mustard)]" />
              <DialogTitle className="text-[var(--color-brand-mustard)]">
                {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {editingCategoria ? "Actualiza los datos de la categoría." : "Registra una nueva categoría."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la categoría"
                  disabled={isLoading}
                  required
                  className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => v && setTipo(v)} disabled={isLoading}>
                  <SelectTrigger className="focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CATALOGO">Catálogo</SelectItem>
                    <SelectItem value="ADICIONAL">Adicional</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--admin-muted-foreground)]">
                  ADICIONAL: productos que se muestran como complementos en la página de detalle.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mostrar-en-catalogo" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Mostrar en catálogo</Label>
                  <p className="text-xs text-[var(--admin-muted-foreground)]">
                    Si está desactivado, los productos de esta categoría no aparecen en el listado principal.
                  </p>
                </div>
                <Switch
                  id="mostrar-en-catalogo"
                  checked={mostrarEnCatalogo}
                  onCheckedChange={setMostrarEnCatalogo}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orden" className="text-[var(--color-brand-rose-dark)]/80 font-medium">Orden</Label>
                <Select
                  value={orden === "" ? "" : String(orden)}
                  onValueChange={(v) => setOrden(v != null ? Number(v) : "")}
                  disabled={isLoading}
                >
                  <SelectTrigger id="orden" className="w-48 focus-visible:ring-[var(--color-brand-mustard)]/30 focus-visible:border-[var(--color-brand-mustard)]/50">
                    <SelectValue placeholder="Selecciona el orden">
                      {orden !== "" ? ordenLabel(Number(orden)) : "Selecciona el orden"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ORDEN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                ) : editingCategoria ? (
                  "Guardar cambios"
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoriaToDelete !== null} onOpenChange={(open) => { if (!open) setCategoriaToDelete(null); }}>
        <DialogContent className="border-t-4 border-t-[var(--admin-danger)]">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la categoría &ldquo;{categoriaToDelete?.nombre}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaToDelete(null)}>
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
