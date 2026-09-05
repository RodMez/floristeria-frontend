"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";

function applyFavicon(iconUrl: string) {
  if (!iconUrl) return;
  if (typeof document === "undefined") return;
  const bust = iconUrl.includes("?") ? `${iconUrl}&v=${iconUrl.slice(-8)}` : `${iconUrl}?v=${Date.now()}`;
  // Remove old dynamic icons (keep static fallback will be re-added if needed, but we replace with dynamic first)
  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]').forEach((el) => {
    // Keep static fallback if no dynamic? We will re-add, so remove all to avoid duplicates
    el.remove();
  });
  const links: Array<{ rel: string; href: string; type?: string; sizes?: string }> = [
    { rel: "icon", href: bust, type: "image/png", sizes: "512x512" },
    { rel: "apple-touch-icon", href: bust, type: "image/png", sizes: "180x180" },
    { rel: "shortcut icon", href: bust },
  ];
  links.forEach(({ rel, href, type, sizes }) => {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (type) link.type = type;
    if (sizes) (link as HTMLLinkElement).sizes.value = sizes;
    document.head.appendChild(link);
  });
}

export default function FaviconSync() {
  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const lastIconRef = useRef<string | null>(null);

  // SWR-driven sync: when config.iconUrl changes, update document
  useEffect(() => {
    const iconUrl = config?.iconUrl?.trim();
    if (!iconUrl || iconUrl === lastIconRef.current) return;
    lastIconRef.current = iconUrl;
    applyFavicon(iconUrl);
  }, [config?.iconUrl]);

  // Cross-tab sync via localStorage + BroadcastChannel
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tao:iconUrl" && e.newValue) {
        applyFavicon(e.newValue);
        lastIconRef.current = e.newValue;
      }
    };
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("tao-icons");
      bc.onmessage = (ev: MessageEvent<{ iconUrl?: string }>) => {
        const iconUrl = ev.data?.iconUrl?.trim();
        if (iconUrl) {
          applyFavicon(iconUrl);
          lastIconRef.current = iconUrl;
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, []);

  return null;
}
