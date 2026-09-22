/**
 * Normalización central de números de WhatsApp (Colombia).
 *
 * wa.me exige formato internacional sin "+" ni espacios ni guiones.
 * En este proyecto el formato canónico es 57 + móvil de 10 dígitos
 * (ej: 573001234567). La BD histórica tiene filas con solo 10 dígitos
 * ("3001234567") que al pasarse crudas a wa.me fallan con
 * "el número no está en WhatsApp".
 */

/** Móvil Colombia normalizado: 57 + 3 + 9 dígitos = 12 dígitos. */
const MOVIL_CO_NORMALIZADO = /^573\d{9}$/;

export function normalizeWhatsappNumber(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Quitar ceros troncales iniciales ("03001234567" -> "3001234567")
  digits = digits.replace(/^0+/, "");

  // Colapsar doble prefijo por bug de tipeo ("5757..." -> "57...")
  while (digits.startsWith("5757") && digits.length > 12) {
    digits = digits.slice(2);
  }

  // 10 dígitos móvil -> anteponer indicativo Colombia
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = `57${digits}`;
  }

  if (!MOVIL_CO_NORMALIZADO.test(digits)) return null;
  return digits;
}

export function buildWaLink(normalized: string, mensaje?: string): string {
  const base = `https://wa.me/${normalized}`;
  if (!mensaje) return base;
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Resuelve el número a usar: primero el de la sede, si es inválido
 * cae al whatsapp general. Retorna null si ninguno normaliza.
 */
export function resolveWhatsappNumber(
  sedeTelefono: string | null | undefined,
  fallbackGeneral: string | null | undefined
): string | null {
  return (
    normalizeWhatsappNumber(sedeTelefono) ??
    normalizeWhatsappNumber(fallbackGeneral)
  );
}
