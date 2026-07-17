"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { BannerDTO } from "@/types";
import BannerCarousel from "@/components/banner/BannerCarousel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ShowcaseBannerModal() {
  const [open, setOpen] = useState(false);

  const { data: banners } = useSWR<BannerDTO[]>(
    `${API_URL}/api/v1/banners?ubicacion=SHOWCASE`,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (banners && banners.length > 0) {
      setOpen(true);
    }
  }, [banners]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Banners promocionales"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Cerrar publicidad"
        >
          <X className="h-5 w-5" />
        </button>

        <BannerCarousel
          ubicacion="SHOWCASE"
          aspectRatio="16/9"
        />

        <div className="flex justify-center bg-white px-6 py-4">
          <Button
            onClick={handleClose}
            className="rounded-full px-8 py-5 bg-brand-mustard hover:bg-[var(--color-brand-mustard-dark)] text-white font-semibold text-sm shadow-md transition-colors"
          >
            Ver Catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}
