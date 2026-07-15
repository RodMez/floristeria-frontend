const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato no soportado. Usa JPG, PNG, WebP o GIF.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'La imagen excede 10MB. Intenta con una más ligera.';
  }
  return null;
}

export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  if (trimmed.startsWith('//')) return '#';
  return trimmed;
}
