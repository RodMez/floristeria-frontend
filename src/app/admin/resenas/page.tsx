"use client";

import useSWR from "swr";
import { fetcher, authFetch } from "@/lib/fetcher";
import { ReseñaResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { StarDisplay } from "@/components/reseñas";
import {
  Loader2,
  CheckCircle2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [tab, setTab] = useState<"pendientes" | "todas">("pendientes");
  const [actionLoading, setActionLoading] = useState<Record<number, string | null>>({});

  const apiUrl = tab === "pendientes"
    ? `${API}/api/admin/resenas/pendientes`
    : `${API}/api/admin/resenas`;

  const { data: reseñas, isLoading, mutate } = useSWR<ReseñaResponse[]>(
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

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta reseña definitivamente?")) return;
    setAction(id, "delete");
    try {
      await authFetch(`${API}/api/admin/resenas/${id}`, {
        method: "DELETE",
      });
      toast.success("Reseña eliminada");
      mutate();
    } catch {
      toast.error("Error al eliminar la reseña");
    } finally {
      setAction(id, null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Reseñas</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-200 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "pendientes"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-800"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab("todas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "todas"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-800"
          }`}
        >
          Todas
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && reseñas && reseñas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare className="h-12 w-12 text-stone-300" />
          <p className="text-stone-500 text-base">
            {tab === "pendientes"
              ? "No hay reseñas pendientes de aprobación"
              : "No hay reseñas registradas"}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && reseñas && reseñas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50 text-left text-stone-600">
                <th className="p-4 font-medium">Producto ID</th>
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
                  <tr key={r.id} className="border-b last:border-0 hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 text-stone-700">#{r.productoId}</td>
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
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
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
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
                          onClick={() => handleDelete(r.id)}
                          disabled={!!loading}
                          className="text-red-600 border-red-200 hover:bg-red-50"
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
    </div>
  );
}
