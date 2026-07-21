"use client";

import useSWR from "swr";
import { fetcher, authFetch } from "@/lib/fetcher";
import { ReseñaResponse } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarDisplay } from "@/components/reseñas";
import {
  Loader2,
  CheckCircle2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRequireSuperAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function AdminReseñasPage() {
  const { isLoading } = useRequireSuperAdmin();
  const [tab, setTab] = useState<"pendientes" | "todas">("pendientes");
  const [actionLoading, setActionLoading] = useState<Record<number, string | null>>({});
  const [reviewToDelete, setReviewToDelete] = useState<ReseñaResponse | null>(null);

  const apiUrl = tab === "pendientes"
    ? `${API}/api/admin/resenas/pendientes`
    : `${API}/api/admin/resenas`;

  const { data: reseñas, isLoading: isLoadingResenas, mutate } = useSWR<ReseñaResponse[]>(
    apiUrl,
    fetcher
  );

  const setAction = (id: number, action: string | null) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
  };

  const handleApprove = async (id: number) => {
    setAction(id, "approve");
    try {
      await authFetch(`${API}/api/admin/resenas/${id}/aprobar`, {
        method: "PATCH",
      });
      toast.success("Reseña aprobada");
      mutate();
    } catch {
      toast.error("Error al aprobar la reseña");
    } finally {
      setAction(id, null);
    }
  };

  const handleDelete = (reseña: ReseñaResponse) => {
    setReviewToDelete(reseña);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    const id = reviewToDelete.id;
    setAction(id, "delete");
    try {
      await authFetch(`${API}/api/admin/resenas/${id}`, {
        method: "DELETE",
      });
      toast.success("Reseña eliminada");
      setReviewToDelete(null);
      mutate();
    } catch {
      toast.error("Error al eliminar la reseña");
    } finally {
      setAction(id, null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[var(--admin-accent)] animate-pulse" />
            <p className="font-heading italic text-[var(--admin-muted-foreground)]">
              Verificando permisos...
            </p>
          </div>
        </div>
      )}

      {!isLoading && (
      <>
      <AdminPageHeader
        title="Reseñas"
        subtitle="Valida las reseñas de los clientes"
        icon={MessageSquare}
        actions={
          reseñas && reseñas.length > 0 ? (
            <StatusBadge
              variant={tab === "pendientes" ? "warning" : "muted"}
              label={`${reseñas.length} ${tab === "pendientes" ? "pendientes" : "totales"}`}
              pulse={tab === "pendientes" && reseñas.length > 0}
            />
          ) : undefined
        }
      />

      <div className="flex gap-1 bg-[var(--admin-canvas)] border border-[var(--admin-border)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
            tab === "pendientes"
              ? "bg-[var(--admin-accent)] text-[var(--admin-sidebar)] shadow-sm"
              : "text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab("todas")}
          className={`px-4 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
            tab === "todas"
              ? "bg-[var(--admin-accent)] text-[var(--admin-sidebar)] shadow-sm"
              : "text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
          }`}
        >
          Todas
        </button>
      </div>

      {isLoadingResenas && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--admin-canvas)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoadingResenas && reseñas && reseñas.length === 0 && (
        <AdminEmptyState
          icon={MessageSquare}
          title={tab === "pendientes" ? "No hay reseñas pendientes de aprobación" : "No hay reseñas registradas"}
          description="Las reseñas de los clientes aparecerán aquí."
        />
      )}

      {!isLoadingResenas && reseñas && reseñas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-canvas)]/60 text-left text-[var(--admin-muted-foreground)]">
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Producto</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Cliente</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Calificación</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Comentario</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Fecha</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Estado</th>
                <th className="p-4 font-heading uppercase tracking-wider text-[11px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reseñas.map((r) => {
                const loading = actionLoading[r.id];
                return (
                  <tr key={r.id} className="border-b border-[var(--admin-border)] last:border-0 transition-colors duration-150 hover:bg-[var(--admin-warning-soft)]/40">
                    <td className="p-4 text-[var(--admin-foreground)] font-medium">{r.productoNombre ?? `#${r.productoId}`}</td>
                    <td className="p-4 text-[var(--admin-foreground)]">{r.clienteNombre}</td>
                    <td className="p-4">
                      <StarDisplay calificacion={r.calificacion} size="sm" />
                    </td>
                    <td className="p-4 text-[var(--admin-muted-foreground)] max-w-[200px] truncate">
                      {r.comentario ? truncate(r.comentario, 60) : "—"}
                    </td>
                    <td className="p-4 text-[var(--admin-muted-foreground)] whitespace-nowrap">{formatDate(r.creadoEn)}</td>
                    <td className="p-4">
                      {r.aprobada ? (
                        <StatusBadge variant="success" icon={CheckCircle2} label="Aprobada" />
                      ) : (
                        <StatusBadge variant="warning" label="Pendiente" pulse />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!r.aprobada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(r.id)}
                            disabled={!!loading}
                            className="text-[var(--admin-success-foreground)] border-[var(--admin-success)]/30 hover:bg-[var(--admin-success-soft)] hover:text-[var(--admin-success-foreground)]"
                          >
                            {loading === "approve" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">Aprobar</span>
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(r)}
                          disabled={!!loading}
                        >
                          {loading === "delete" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1">Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={reviewToDelete !== null} onOpenChange={(open) => { if (!open) setReviewToDelete(null); }}>
        <DialogContent className="sm:max-w-md border-t-4 border-t-[var(--admin-danger)]">
          <DialogHeader className="items-center text-center border-b border-[var(--admin-border)] pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-[var(--admin-danger-soft)] flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5 text-[var(--admin-danger-foreground)]" />
            </div>
            <DialogTitle className="text-[var(--admin-foreground)] font-heading text-lg">Eliminar reseña</DialogTitle>
            <DialogDescription className="text-[var(--admin-muted-foreground)] text-center font-heading italic">
              ¿Estás seguro de eliminar la reseña de <span className="font-medium text-[var(--admin-foreground)] not-italic">&ldquo;{reviewToDelete?.clienteNombre}&rdquo;</span> para el producto <span className="font-medium text-[var(--admin-foreground)] not-italic">&ldquo;{reviewToDelete?.productoNombre ?? `#${reviewToDelete?.productoId}`}&rdquo;</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center pt-2 border-t border-[var(--admin-border)]">
            <Button
              variant="outline"
              onClick={() => setReviewToDelete(null)}
              className="border-[var(--admin-border)] text-[var(--admin-muted-foreground)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]"
            >
              No, volver
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!actionLoading[reviewToDelete?.id ?? 0]}
            >
              {actionLoading[reviewToDelete?.id ?? 0] === "delete" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
