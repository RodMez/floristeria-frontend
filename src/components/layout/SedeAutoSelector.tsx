"use client";

import { useEffect } from "react";
import { useSedes } from "@/hooks/useSedes";
import { useCartStore } from "@/store/useCartStore";

export default function SedeAutoSelector() {
  const { esUnicaSede, sedeUnica } = useSedes();
  const sedeActual = useCartStore((s) => s.sedeActual);
  const setSedeActual = useCartStore((s) => s.setSedeActual);

  useEffect(() => {
    if (esUnicaSede && sedeUnica && sedeActual?.id !== sedeUnica.id) {
      setSedeActual(sedeUnica);
    }
  }, [esUnicaSede, sedeUnica, sedeActual, setSedeActual]);

  return null;
}
