"use client";

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function imagekitLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith("/")) return src;
  try {
    const url = new URL(src);
    if (url.hostname === "ik.imagekit.io") {
      const sep = src.includes("?") ? "&" : "?";
      return `${src}${sep}tr=w-${width},q-${quality || 75}`;
    }
  } catch {
    // URL inválida: devolver tal cual
  }
  return src;
}
