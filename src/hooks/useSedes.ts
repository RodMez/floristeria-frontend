"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Sede } from "@/types";

const SEDES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sedes`;

export function useSedes() {
  const { data: sedes, isLoading, error, mutate } = useSWR<Sede[]>(
    SEDES_URL,
    fetcher
  );

  const lista = sedes ?? [];
  const esUnicaSede = lista.length === 1;
  const sedeUnica = esUnicaSede ? lista[0] : null;

  return { sedes: lista, isLoading, error, mutate, esUnicaSede, sedeUnica };
}
