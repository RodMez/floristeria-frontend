/**
 * Extrae un mensaje legible de un error de la API.
 * El backend responde JSON {status, error, mensaje} — sin esto el toast
 * muestra el JSON crudo (ej: {"status":429,...}).
 */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Response) return fallback;
  if (!(e instanceof Error)) return fallback;
  const raw = e.message;
  if (!raw) return fallback;
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object") {
      const msg = (j as Record<string, unknown>).mensaje ?? (j as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
  } catch {
    // no era JSON: devolver tal cual
  }
  return raw;
}

/**
 * Lee el cuerpo de una respuesta HTTP fallida y lanza Error
 * con el mensaje del backend ({mensaje} o {message}) cuando existe.
 */
export async function throwApiError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text().catch(() => "");
  if (!raw) throw new Error(fallback);
  try {
    const j = JSON.parse(raw);
    const msg = j?.mensaje ?? j?.message;
    if (typeof msg === "string" && msg.trim()) throw new Error(msg);
  } catch (e) {
    if (e instanceof Error && e.message !== raw) throw e;
  }
  throw new Error(raw || fallback);
}
