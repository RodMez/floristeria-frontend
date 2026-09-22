/**
 * Utilidades de fecha con hora de Colombia.
 *
 * Regla: los strings con hora ("2026-09-19T10:30:00") se parsean como hora
 * local (comportamiento nativo, correcto). Los strings solo-fecha
 * ("2026-09-19", tipo LocalDate del backend) NO deben pasar por `new Date()`
 * directo: ECMAScript los interpreta como medianoche UTC y en Colombia
 * (UTC-5) se muestran un día antes. Aquí se construyen a mediodía local,
 * preservando los dígitos en cualquier zona horaria.
 */

/** Parsea un string de fecha/hora a Date preservando los dígitos. */
export function parseFecha(input: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(input);
}

/** "2026-09-19" (o datetime) -> "19/09/2026". */
export function formatearFechaCorta(input: string): string {
  return parseFecha(input).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Hoy en hora local como "yyyy-mm-dd" (para inputs date y comparaciones). */
export function hoyLocalISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
