"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const labels = [
  "",
  "1 estrella — Muy malo",
  "2 estrellas — Malo",
  "3 estrellas — Regular",
  "4 estrellas — Bueno",
  "5 estrellas — Excelente",
];

export default function StarSelector({ value, onChange }: StarSelectorProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform duration-200 hover:scale-115 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-mustard)]/40 rounded-sm cursor-pointer"
            aria-label={labels[i]}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors duration-200",
                i <= (hover || value)
                  ? "fill-[var(--color-brand-mustard)] text-[var(--color-brand-mustard)]"
                  : "fill-stone-200 text-stone-200"
              )}
            />
          </button>
        ))}
      </div>
      <span className={cn(
        "text-sm min-h-5 transition-colors duration-200",
        value > 0 ? "text-[var(--color-brand-mustard-dark)] font-medium" : "text-stone-500"
      )}>
        {value > 0 ? labels[value] : "Selecciona tu calificación"}
      </span>
    </div>
  );
}
