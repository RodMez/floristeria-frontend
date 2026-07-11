"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { Sede } from "@/types";

interface SedeCardProps {
  sede: Sede;
  variant?: "navigable" | "static";
}

export default function SedeCard({ sede, variant = "navigable" }: SedeCardProps) {
  const router = useRouter();
  const isNavigable = variant === "navigable";

  const handleCardClick = () => {
    if (isNavigable) {
      router.push(`/tienda/sede/${sede.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isNavigable && e.key === "Enter") {
      router.push(`/tienda/sede/${sede.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role={isNavigable ? "link" : undefined}
      tabIndex={isNavigable ? 0 : undefined}
      onKeyDown={isNavigable ? handleKeyDown : undefined}
      className={isNavigable ? "cursor-pointer" : undefined}
    >
      <Card className="group border-t-4 border-b-4 border-t-brand-rose border-b-brand-rose hover:border-t-brand-mustard hover:border-b-brand-mustard transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-heading text-lg font-semibold text-stone-800 group-hover:text-brand-mustard transition-colors duration-200">
              {sede.nombre}
            </h3>
            {sede.ciudad && (
              <>
                <span className="text-stone-300">|</span>
                <div className="flex items-center gap-1 text-sm text-brand-sage group-hover:text-brand-rose-dark transition-colors duration-200">
                  <MapPin className="size-4 shrink-0" />
                  {sede.ciudad}
                </div>
              </>
            )}
          </div>

          {sede.telefonoWhatsapp && (
            <div className="flex items-center justify-center gap-2">
              <a
                href={`https://wa.me/${sede.telefonoWhatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-rose-dark transition-colors"
              >
                <FaWhatsapp className="size-4 shrink-0 text-brand-sage" />
                {sede.telefonoWhatsapp}
              </a>
            </div>
          )}
          {sede.email && (
            <div className="flex items-center justify-center gap-2">
              <a
                href={`mailto:${sede.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-rose-dark transition-colors"
              >
                <MdEmail className="size-4 shrink-0 text-brand-mustard" />
                <span className="truncate">{sede.email}</span>
              </a>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            {sede.instagramUrl && (
              <a
                href={sede.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center rounded-full p-2.5 text-brand-rose-dark transition-colors hover:bg-brand-rose/40"
                title="Instagram"
              >
                <FaInstagram className="size-5" />
              </a>
            )}
            {sede.facebookUrl && (
              <a
                href={sede.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center rounded-full p-2.5 text-blue-600 transition-colors hover:bg-brand-rose/40"
                title="Facebook"
              >
                <FaFacebook className="size-5" />
              </a>
            )}
            {sede.tiktokUrl && (
              <a
                href={sede.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center rounded-full p-2.5 text-stone-700 transition-colors hover:bg-brand-rose/40"
                title="TikTok"
              >
                <FaTiktok className="size-5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
