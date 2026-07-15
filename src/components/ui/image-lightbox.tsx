"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogPopup } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  alt?: string;
}

export default function ImageLightbox({
  open,
  onOpenChange,
  images,
  currentIndex,
  onIndexChange,
  alt,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<{
    distance: number;
    x: number;
    y: number;
    isPinch: boolean;
  } | null>(null);
  const lastTapRef = useRef<number>(0);

  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const toggleZoom = useCallback(() => {
    setScale((prev) => (prev === 1 ? 1.5 : 1));
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchStartRef.current = {
        distance: getTouchDistance(e.touches),
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        isPinch: true,
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        distance: 0,
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
        isPinch: false,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2 && touchStartRef.current.isPinch) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const ratio = currentDistance / touchStartRef.current.distance;
      const newScale = Math.min(Math.max(scale * ratio, 1), 3);
      setScale(newScale);
      touchStartRef.current.distance = currentDistance;
    } else if (
      e.touches.length === 1 &&
      scale > 1 &&
      !touchStartRef.current.isPinch
    ) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    if (scale < 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleZoom();
    }
    lastTapRef.current = now;
  };

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      onIndexChange(newIndex);
    },
    [onIndexChange]
  );

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      handleIndexChange(currentIndex + 1);
    }
  }, [currentIndex, images.length, handleIndexChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      handleIndexChange(currentIndex - 1);
    }
  }, [currentIndex, handleIndexChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") handleOpenChange(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, images.length, goNext, goPrev, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/90" />
        <DialogPopup className="fixed inset-0 z-[60] flex items-center justify-center bg-transparent p-0 m-0 max-w-none rounded-none border-none">
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={toggleZoom}
            className="absolute top-4 right-14 z-50 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label={scale > 1 ? "Reducir zoom" : "Ampliar imagen"}
          >
            {scale > 1 ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </button>

          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            ref={imgRef}
            src={images[currentIndex]}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] select-none object-contain transition-transform duration-150"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? "grab" : "zoom-in",
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleDoubleTap}
            draggable={false}
          />

          {currentIndex < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white/80 backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
