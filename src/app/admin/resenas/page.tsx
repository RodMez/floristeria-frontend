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
    <div className="space-y-6">
      {isLoading && (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-stone-500">Verificando permisos...</p>
          </div>
        </div>
      )}

      {!isLoading && (
      <>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-stone-800">Reseñas</h1>
        {reseñas && reseñas.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-mustard)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-mustard-dark)]">
            {reseñas.length}
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            tab === "pendientes"
              ? "bg-[var(--color-brand-mustard)] text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab("todas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            tab === "todas"
              ? "bg-[var(--color-brand-mustard)] text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Todas
        </button>
      </div>

      {isLoadingResenas && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoadingResenas && reseñas && reseñas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-[var(--color-brand-mustard)]/10 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-[var(--color-brand-mustard)]/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-600">
              {tab === "pendientes"
                ? "No hay reseñas pendientes de aprobación"
                : "No hay reseñas registradas"}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Las reseñas de los clientes aparecerán aquí
            </p>
          </div>
        </div>
      )}

      {!isLoadingResenas && reseñas && reseñas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-stone-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-stone-500">
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Calificación</th>
                <th className="p-4 font-medium">Comentario</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reseñas.map((r) => {
                const loading = actionLoading[r.id];
                return (
                  <tr key={r.id} className="border-b border-stone-50 last:border-0 transition-colors duration-150 hover:bg-[var(--color-brand-mustard)]/5">
                    <td className="p-4 text-stone-700 font-medium">{r.productoNombre ?? `#${r.productoId}`}</td>
                    <td className="p-4 text-stone-700">{r.clienteNombre}</td>
                    <td className="p-4">
                      <StarDisplay calificacion={r.calificacion} size="sm" />
                    </td>
                    <td className="p-4 text-stone-600 max-w-[200px] truncate">
                      {r.comentario ? truncate(r.comentario, 60) : "—"}
                    </td>
                    <td className="p-4 text-stone-500 whitespace-nowrap">{formatDate(r.creadoEn)}</td>
                    <td className="p-4">
                      {r.aprobada ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-sage)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-sage)]">
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-mustard)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-mustard-dark)]">
                          Pendiente
                        </span>
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
                            className="text-[var(--color-brand-sage)] border-[var(--color-brand-sage)]/20 hover:bg-[var(--color-brand-sage)]/10 hover:text-[var(--color-brand-sage)]"
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(r)}
                          disabled={!!loading}
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
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
        <DialogContent className="sm:max-w-md border-red-100">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <DialogTitle className="text-stone-800">Eliminar reseña</DialogTitle>
            <DialogDescription className="text-stone-500 text-center">
              ¿Estás seguro de eliminar la reseña de <span className="font-medium text-stone-700">&ldquo;{reviewToDelete?.clienteNombre}&rdquo;</span> para el producto <span className="font-medium text-stone-700">&ldquo;{reviewToDelete?.productoNombre ?? `#${reviewToDelete?.productoId}`}&rdquo;</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center pt-2 border-t border-stone-100">
            <Button
              variant="outline"
              onClick={() => setReviewToDelete(null)}
              className="border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
            >
              No, volver
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!actionLoading[reviewToDelete?.id ?? 0]}
              className="bg-red-500 hover:bg-red-600 text-white"
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
