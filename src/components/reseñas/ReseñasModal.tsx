"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
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
import { Loader2, MessageSquare, CheckCircle2, Clock } from "lucide-react";

interface ReseñasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoId: number;
  productoNombre: string;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reseñas de {productoNombre}</DialogTitle>
          <DialogDescription>
            {reseñasData && reseñasData.total > 0
              ? `${reseñasData.total} reseña${reseñasData.total !== 1 ? "s" : ""} — ${reseñasData.promedio.toFixed(1)} estrellas`
              : "Sé el primero en opinar"}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-base font-medium text-stone-800">
              ¡Reseña enviada!
            </p>
            <p className="text-sm text-stone-500">
              Gracias por tu opinión. Tu reseña será visible después de ser
              aprobada por nuestro equipo.
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mt-2"
            >
              Cerrar
            </Button>
          </div>
        ) : puedeCrear && tab === "crear" ? (
          <div className="space-y-5 py-4">
            <StarSelector
              value={calificacion}
              onChange={setCalificacion}
            />
            <div className="space-y-2">
              <label
                htmlFor="comentario"
                className="text-sm font-medium text-stone-700"
              >
                Tu comentario <span className="text-stone-400">(opcional)</span>
              </label>
              <Textarea
                id="comentario"
                placeholder="Cuéntanos tu experiencia con este producto..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setTab("ver")}
                className="flex-1"
              >
                Ver reseñas
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-[var(--color-brand-mustard)] text-stone-900 hover:brightness-90"
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
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setTab("crear")}
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Escribir una reseña
                </Button>
              </div>
            )}

            {!reseñasData || reseñasData.reseñas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <MessageSquare className="h-10 w-10 text-stone-300" />
                <p className="text-stone-500">
                  {token
                    ? "No hay reseñas aún. ¡Sé el primero en opinar!"
                    : "No hay reseñas aún. Inicia sesión para dejar tu opinión."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {miReseña && (
                  <div className="rounded-lg border-l-4 border-[var(--color-brand-mustard)] bg-stone-50 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-stone-800">
                        Tu reseña
                        {!miReseña.aprobada && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600 font-normal">
                            <Clock className="h-3 w-3" />
                            Pendiente de aprobación
                          </span>
                        )}
                      </span>
                    </div>
                    <StarDisplay calificacion={miReseña.calificacion} size="sm" />
                    {miReseña.comentario && (
                      <p className="mt-2 text-sm text-stone-600">
                        {miReseña.comentario}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">
                      {formatDate(miReseña.creadoEn)}
                    </p>
                  </div>
                )}

                {reseñasData.reseñas
                  .filter((r) => !miReseña || r.id !== miReseña.id)
                  .map((reseña: ReseñaResponse) => (
                    <div key={reseña.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-stone-700">
                          {reseña.clienteNombre}
                        </span>
                      </div>
                      <StarDisplay calificacion={reseña.calificacion} size="sm" />
                      {reseña.comentario && (
                        <p className="mt-2 text-sm text-stone-600">
                          {reseña.comentario}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-stone-400">
                        {formatDate(reseña.creadoEn)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
