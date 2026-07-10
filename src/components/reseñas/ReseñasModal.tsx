"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ReseñasProductoResponse,
  ReseñaEstado,
  ReseñaRequest,
  ReseñaResponse,
} from "@/types";
import { fetcher, authFetch } from "@/lib/fetcher";
import StarDisplay from "./StarDisplay";
import StarSelector from "./StarSelector";
import { toast } from "sonner";
import { Loader2, MessageSquare, CheckCircle2, Clock, PenLine } from "lucide-react";

interface ReseñasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoId: number;
  productoNombre: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function DistributionBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-stone-500 font-medium">{stars}</span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-brand-mustard)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-stone-400 tabular-nums">{count}</span>
    </div>
  );
}

export default function ReseñasModal({
  open,
  onOpenChange,
  productoId,
  productoNombre,
}: ReseñasModalProps) {
  const [tab, setTab] = useState<"ver" | "crear">("ver");
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const token = Cookies.get("token");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { data: reseñasData, mutate: mutateReseñas } =
    useSWR<ReseñasProductoResponse>(
      `${apiUrl}/api/v1/resenas/producto/${productoId}`,
      fetcher
    );

  const { data: estadoData, mutate: mutateEstado } = useSWR<ReseñaEstado>(
    token
      ? `${apiUrl}/api/v1/resenas/producto/${productoId}/estado`
      : null,
    fetcher
  );

  useEffect(() => {
    if (open) {
      setCalificacion(0);
      setComentario("");
      setSubmitted(false);
      setTab("ver");
      mutateReseñas();
      if (token) mutateEstado();
    }
  }, [open, token, mutateReseñas, mutateEstado]);

  const puedeCrear = estadoData?.puedeCrear === true;
  const miReseña = estadoData?.miReseña ?? null;

  const distribution = useMemo(() => {
    if (!reseñasData) return [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    reseñasData.reseñas.forEach((r) => {
      if (r.calificacion >= 1 && r.calificacion <= 5) {
        counts[r.calificacion - 1]++;
      }
    });
    return counts;
  }, [reseñasData]);

  const handleSubmit = async () => {
    if (calificacion === 0) {
      toast.error("Selecciona una calificación");
      return;
    }
    setSubmitting(true);
    try {
      const body: ReseñaRequest = {
        productoId,
        calificacion,
        comentario: comentario.trim() || undefined,
      };
      await authFetch(`${apiUrl}/api/v1/resenas`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setSubmitted(true);
      mutateReseñas();
      mutateEstado();
      toast.success("Reseña enviada para aprobación", {
        description: "Gracias por tu opinión. Será visible tras ser aprobada.",
      });
    } catch (err) {
      toast.error("Error al enviar reseña", {
        description: err instanceof Error ? err.message : "Intenta de nuevo",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalReseñas = reseñasData?.total ?? 0;
  const promedio = reseñasData?.promedio ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="relative bg-gradient-to-b from-stone-50 to-background px-6 pt-6 pb-4 border-b border-[var(--color-brand-mustard)]/20">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-stone-800 pr-8">
              Reseñas
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500">
              {productoNombre}
            </DialogDescription>
          </DialogHeader>

          {totalReseñas > 0 && (
            <div className="flex items-start gap-4 mt-4">
              <div className="flex flex-col items-center min-w-[64px]">
                <span className="text-3xl font-bold text-stone-800 leading-none tabular-nums">
                  {promedio.toFixed(1)}
                </span>
                <StarDisplay calificacion={Math.round(promedio)} size="sm" />
                <span className="text-[11px] text-stone-400 mt-1">
                  {totalReseñas} reseña{totalReseñas !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex-1 space-y-1 pt-0.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <DistributionBar
                    key={stars}
                    stars={stars}
                    count={distribution[stars - 1]}
                    total={totalReseñas}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-14 w-14 rounded-full bg-[var(--color-brand-sage)]/15 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-[var(--color-brand-sage)]" />
              </div>
              <p className="text-base font-semibold text-stone-800">
                ¡Reseña enviada!
              </p>
              <p className="text-sm text-stone-500 max-w-xs">
                Gracias por tu opinión. Tu reseña será visible después de ser
                aprobada por nuestro equipo.
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-2 border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
              >
                Cerrar
              </Button>
            </div>
          ) : puedeCrear && tab === "crear" ? (
            <div className="space-y-5 py-2">
              <StarSelector value={calificacion} onChange={setCalificacion} />
              <div className="space-y-2">
                <label htmlFor="comentario" className="text-sm font-medium text-stone-700">
                  Tu comentario <span className="text-stone-400 font-normal">(opcional)</span>
                </label>
                <Textarea
                  id="comentario"
                  placeholder="Cuéntanos tu experiencia con este producto..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="resize-none border-stone-200 focus:border-[var(--color-brand-mustard)] focus:ring-[var(--color-brand-mustard)]/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setTab("ver")}
                  className="flex-1 border-stone-200 text-stone-600 hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
                >
                  Ver reseñas
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Reseña"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {puedeCrear && (
                <Button
                  onClick={() => setTab("crear")}
                  className="w-full bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)] font-semibold"
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Escribir una reseña
                </Button>
              )}

              {!reseñasData || reseñasData.reseñas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-[var(--color-brand-mustard)]/10 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-[var(--color-brand-mustard)]/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-600">
                      {token ? "No hay reseñas aún" : "No hay reseñas aún"}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {token
                        ? "Sé el primero en opinar sobre este producto"
                        : "Inicia sesión para dejar tu opinión"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {miReseña && (
                    <div className="rounded-lg border-l-4 border-[var(--color-brand-mustard)] bg-[var(--color-brand-mustard)]/5 p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-[var(--color-brand-rose)]/25 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[var(--color-brand-rose-dark)]">
                              {getInitials(miReseña.clienteNombre)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-stone-800">
                            Tu reseña
                          </span>
                        </div>
                        {!miReseña.aprobada && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-brand-sage)] bg-[var(--color-brand-sage)]/10 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </span>
                        )}
                      </div>
                      <StarDisplay calificacion={miReseña.calificacion} size="sm" />
                      {miReseña.comentario && (
                        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                          {miReseña.comentario}
                        </p>
                      )}
                      <p className="mt-1.5 text-[11px] text-stone-400">
                        {formatDate(miReseña.creadoEn)}
                      </p>
                    </div>
                  )}

                  {reseñasData.reseñas
                    .filter((r) => !miReseña || r.id !== miReseña.id)
                    .map((reseña: ReseñaResponse) => (
                      <div
                        key={reseña.id}
                        className="rounded-lg border border-stone-100 p-4 transition-colors duration-200 hover:border-[var(--color-brand-mustard)]/25"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[var(--color-brand-rose)]/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-[var(--color-brand-rose-dark)]">
                                {getInitials(reseña.clienteNombre)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-stone-700">
                              {reseña.clienteNombre}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {formatDate(reseña.creadoEn)}
                          </span>
                        </div>
                        <StarDisplay calificacion={reseña.calificacion} size="sm" />
                        {reseña.comentario && (
                          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                            {reseña.comentario}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
