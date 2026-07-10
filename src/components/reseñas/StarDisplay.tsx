import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarDisplayProps {
  calificacion: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

export default function StarDisplay({ calificacion, size = "md" }: StarDisplayProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${calificacion} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            "transition-colors duration-200",
            i <= calificacion
              ? "fill-[var(--color-brand-mustard)] text-[var(--color-brand-mustard)]"
              : "fill-stone-200 text-stone-200"
          )}
        />
      ))}
    </div>
  );
}
