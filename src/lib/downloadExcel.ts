import Cookies from "js-cookie";

export type DownloadExcelParams = Record<string, string | number | null | undefined>;

function parseFilename(contentDisposition: string | null, fallback: string): string {
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim());
      } catch {
        return utf8Match[1].trim();
      }
    }
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return fallback;
}

export async function downloadExcel(opts: {
  endpoint: string;
  params?: DownloadExcelParams;
  fallbackFilename: string;
}): Promise<string> {
  const token = Cookies.get("token");

  const query = opts.params
    ? new URLSearchParams(
        Object.entries(opts.params)
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  const url = query ? `${opts.endpoint}?${query}` : opts.endpoint;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let message = raw || `Error ${res.status}`;
    try {
      const parsed = JSON.parse(raw);
      message = parsed.mensaje || parsed.message || message;
    } catch {
      // raw no es JSON, usar tal cual
    }
    if (res.status === 401) {
      throw new Error("Sesión expirada. Inicia sesión nuevamente.");
    }
    if (res.status === 403) {
      throw new Error("Sin permiso para exportar esa sede.");
    }
    if (res.status === 404) {
      throw new Error("Sede no encontrada.");
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  if (blob.size === 0) {
    throw new Error("El archivo descargado está vacío.");
  }

  const filename = parseFilename(res.headers.get("content-disposition"), opts.fallbackFilename);

  const objectUrl = window.URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }

  return filename;
}
