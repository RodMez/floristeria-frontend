"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, authFetch } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const configSchema = z.object({
  enviarCopiaMaestro: z.boolean(),
  correoMaestro: z
    .string()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function ConfiguracionPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: configuracion,
    error,
    mutate,
  } = useSWR<ConfiguracionTiendaDTO>(
    `${API_URL}/api/superadmin/configuracion`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      enviarCopiaMaestro: false,
      correoMaestro: "",
    },
  });

  const watchedEnviarCopia = watch("enviarCopiaMaestro");

  useEffect(() => {
    if (configuracion) {
      reset({
        enviarCopiaMaestro: configuracion.enviarCopiaMaestro,
        correoMaestro: configuracion.correoMaestro ?? "",
      });
    }
  }, [configuracion, reset]);

  useEffect(() => {
    const errorList = Object.values(errors);
    if (errorList.length > 0) {
      errorList.forEach((err) => {
        if (err?.message) {
          toast.error(err.message as string);
        }
      });
    }
  }, [errors]);

  const onSubmit = async (data: ConfigFormData) => {
    setIsLoading(true);

    const payload: ConfiguracionTiendaDTO = {
      enviarCopiaMaestro: data.enviarCopiaMaestro,
      correoMaestro: data.correoMaestro || null,
    };

    try {
      await authFetch<ConfiguracionTiendaDTO>(
        `${API_URL}/api/superadmin/configuracion`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      toast.success("Configuración actualizada");
      mutate();
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error(
        `Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error al cargar la configuración: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-stone-400 animate-pulse" />
          <p className="text-stone-500">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Configuración</h1>
        <p className="text-stone-500 text-sm mt-1">
          Gestiona la configuración general de la tienda
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
            <Switch
              checked={watchedEnviarCopia}
              onCheckedChange={(checked: boolean) =>
                setValue("enviarCopiaMaestro", checked, { shouldValidate: true })
              }
            />
            <Label className="text-sm font-medium cursor-pointer">
              Enviar copia de todas las ventas al Correo Maestro
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correoMaestro">Correo Maestro</Label>
            <Input
              id="correoMaestro"
              type="email"
              {...register("correoMaestro")}
              placeholder="correo@ejemplo.com"
              disabled={isLoading}
            />
            <p className="text-xs text-stone-500">
              {watchedEnviarCopia
                ? "Se enviarán copias de todas las ventas a este correo."
                : "Activa la opción anterior para recibir copias de ventas."}
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
