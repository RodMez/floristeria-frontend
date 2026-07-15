"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { BannerDTO, UbicacionBanner } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function imageKitUrl(base: string, w: number, h: number): string {
  if (base.includes("ik.imagekit.io")) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}tr=w-${w},h-${h},c-at_max`;
  }
  return base;
}

interface BannerCarouselProps {
  ubicacion: UbicacionBanner;
  sedeId?: number;
  aspectRatio?: string;
  maxHeight?: number;
}

function BannerSkeleton({ maxHeight }: { maxHeight: number }) {
  return (
    <div
      className="w-full aspect-[3/1] min-h-[200px] overflow-hidden bg-stone-100 animate-pulse"
      style={{ maxHeight }}
    >
      <div className="flex h-full items-end p-6 md:p-10">
        <div className="space-y-3 w-full max-w-xl">
          <div className="h-8 w-3/4 rounded bg-stone-200" />
          <div className="h-4 w-1/2 rounded bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

export default function BannerCarousel({
  ubicacion,
  sedeId,
  aspectRatio,
  maxHeight = 640,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const params = new URLSearchParams({ ubicacion });
  if (sedeId != null) params.set("sedeId", String(sedeId));

  const { data: banners } = useSWR<BannerDTO[]>(
    `${API_URL}/api/v1/banners?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const total = banners?.length ?? 0;

  const goTo = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total);
  }, [total]);

  const goNext = useCallback(() => goTo(current + 1), [goTo, current]);
  const goPrev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, isPaused, goNext]);

  if (!banners) return <BannerSkeleton maxHeight={maxHeight} />;
  if (banners.length === 0) return null;

  const banner = banners[current];

  const containerClass = aspectRatio
    ? `relative w-full overflow-hidden ${
        aspectRatio === "1/1" ? "aspect-square max-w-sm" :
        aspectRatio === "16/9" ? "aspect-[16/9]" :
        "aspect-[21/9] max-h-[400px]"
      }`
    : "relative w-full overflow-hidden aspect-[3/1] min-h-[200px]";

  const content = (
    <div
      className={containerClass}
      style={aspectRatio ? undefined : { maxHeight, minHeight: 200 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Image
        src={aspectRatio
          ? imageKitUrl(banner.imagenUrl, aspectRatio === "1/1" ? 600 : 1200, aspectRatio === "1/1" ? 600 : aspectRatio === "16/9" ? 675 : 400)
          : imageKitUrl(banner.imagenUrl, 1920, 640)
        }
        alt={banner.titulo ?? "Banner promocional"}
        fill
        className="object-cover"
        priority={current === 0}
        sizes={aspectRatio
          ? aspectRatio === "1/1" ? "(max-width: 640px) 100vw, 300px" : "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
          : "(max-width: 767px) 100vw, 1920px"
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10">
        {banner.titulo && (
          <h2 className="text-white text-xl md:text-3xl font-bold drop-shadow-lg">
            {banner.titulo}
          </h2>
        )}
        {banner.texto && (
          <p className="text-white/90 text-sm md:text-base mt-1 max-w-xl drop-shadow-md">
            {banner.texto}
          </p>
        )}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Anterior banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Siguiente banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full" role="region" aria-roledescription="carousel" aria-label="Banners promocionales">
      {banner.enlaceUrl ? (
        <Link href={banner.enlaceUrl} className="block">
          {content}
        </Link>
      ) : content}

      {total > 1 && (
        <div className="flex justify-center gap-2 py-3" role="tablist" aria-label="Navegacion de banners">
          {banners.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Banner ${i + 1} de ${total}`}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-mustard)] ${
                i === current
                  ? "w-8 bg-[var(--color-brand-mustard)]"
                  : "w-2.5 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
