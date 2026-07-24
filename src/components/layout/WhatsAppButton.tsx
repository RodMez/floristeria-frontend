"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { FaWhatsapp } from "@/components/icons/SocialIcons";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const numero = config?.whatsappGeneral?.replace(/\D/g, "");
  if (!numero) return null;

  const mensaje = encodeURIComponent(
    "Hola! Me gustaría recibir ayuda para elegir un arreglo floral. Podrían orientarme?"
  );
  const href = `https://wa.me/${numero}?text=${mensaje}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-row items-center gap-2">
      {showTooltip && (
        <span className="bg-white text-stone-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          Hola! Me gustaría recibir ayuda para elegir un arreglo floral. Podrían orientarme?
        </span>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center justify-center size-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
      >
        <FaWhatsapp className="size-7" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      </a>
    </div>
  );
}
