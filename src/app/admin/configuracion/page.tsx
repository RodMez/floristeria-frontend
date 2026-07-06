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
import {
  Settings,
  Save,
  Copy,
  Mail,
  Image as ImageIcon,
  Globe,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const configSchema = z.object({
  enviarCopiaMaestro: z.boolean(),
  correoMaestro: z.string().email("Correo inválido").optional().or(z.literal("")),
  whatsappGeneral: z.string().optional().or(z.literal("")),
  instagramUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  facebookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  tiktokUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  imagenHeroUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  imagenBannerUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type ConfigFormData = z.infer<typeof configSchema>;

function CardSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-t-4 border-t-[var(--color-brand-mustard)]">
      {Icon && (
        <div className="flex items-center gap-2 px-6 pt-5 pb-0">
          <Icon className="h-5 w-5 text-[var(--color-brand-mustard)]" />
          <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
        </div>
      )}
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function ImagePreviewCard({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-stone-400" />
        <span className="text-sm font-medium text-stone-700">{label}</span>
      </div>

      {value && (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          <Image
            src={value}
            alt={label}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Pega la URL de ImageKit aquí"}
          disabled={disabled}
          className="flex-1 font-mono text-sm"
        />
      </div>
      <p className="text-xs text-stone-500">
        Sube la imagen en{" "}
        <span className="font-medium text-stone-700">Productos → Imágenes</span>{" "}
        y pega aquí la URL generada.
      </p>
    </div>
  );
}

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
      whatsappGeneral: "",
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      imagenHeroUrl: "",
      imagenBannerUrl: "",
    },
  });

  const watchedEnviarCopia = watch("enviarCopiaMaestro");
  const watchedHeroUrl = watch("imagenHeroUrl");
  const watchedBannerUrl = watch("imagenBannerUrl");

  const metaFeedUrl = `${API_URL}/api/v1/catalogo/meta-feed`;

  const handleCopyMetaFeed = () => {
    navigator.clipboard.writeText(metaFeedUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  useEffect(() => {
    if (configuracion) {
      reset({
        enviarCopiaMaestro: configuracion.enviarCopiaMaestro,
        correoMaestro: configuracion.correoMaestro ?? "",
        whatsappGeneral: configuracion.whatsappGeneral ?? "",
        instagramUrl: configuracion.instagramUrl ?? "",
        facebookUrl: configuracion.facebookUrl ?? "",
        tiktokUrl: configuracion.tiktokUrl ?? "",
        imagenHeroUrl: configuracion.imagenHeroUrl ?? "",
        imagenBannerUrl: configuracion.imagenBannerUrl ?? "",
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
      whatsappGeneral: data.whatsappGeneral || null,
      instagramUrl: data.instagramUrl || null,
      facebookUrl: data.facebookUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      imagenHeroUrl: data.imagenHeroUrl || null,
      imagenBannerUrl: data.imagenBannerUrl || null,
    };

    try {
      await authFetch<ConfiguracionTiendaDTO>(
        `${API_URL}/api/superadmin/configuracion`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      toast.success("Configuración actualizada correctamente");
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
        <div
          className="border border-red-400 bg-red-50 px-4 py-3 text-red-700 rounded-lg"
          role="alert"
        >
          <p>Error al cargar la configuración: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <Settings className="mx-auto mb-4 h-12 w-12 animate-pulse text-stone-400" />
          <p className="text-stone-500">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Configuración de Tienda
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Gestiona la configuración general de TAO Boutique Floral
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Correo y Notificaciones */}
        <CardSection title="Correo y Notificaciones" icon={Mail}>
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <Switch
                id="enviarCopiaMaestro"
                checked={watchedEnviarCopia}
                onCheckedChange={(checked: boolean) =>
                  setValue("enviarCopiaMaestro", checked, { shouldValidate: true })
                }
              />
              <Label htmlFor="enviarCopiaMaestro" className="text-sm font-medium cursor-pointer">
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
                className={errors.correoMaestro ? "border-red-400" : ""}
              />
              {errors.correoMaestro && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.correoMaestro.message}
                </p>
              )}
              <p className="text-xs text-stone-500">
                {watchedEnviarCopia
                  ? "Se enviarán copias de todas las ventas a este correo."
                  : "Activa la opción anterior para recibir copias de ventas."}
              </p>
            </div>
          </div>
        </CardSection>

        {/* Redes Sociales */}
        <CardSection title="Redes Sociales" icon={Globe}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsappGeneral" className="flex items-center gap-1.5">
                <FaWhatsapp className="h-4 w-4 text-emerald-500" />
                WhatsApp General
              </Label>
              <Input
                id="whatsappGeneral"
                type="text"
                {...register("whatsappGeneral")}
                placeholder="+57 300 123 4567"
                disabled={isLoading}
              />
              {errors.whatsappGeneral && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.whatsappGeneral.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl" className="flex items-center gap-1.5">
                <FaInstagram className="h-4 w-4 text-pink-500" />
                Instagram
              </Label>
              <Input
                id="instagramUrl"
                type="url"
                {...register("instagramUrl")}
                placeholder="https://instagram.com/tao.floral"
                disabled={isLoading}
                className={errors.instagramUrl ? "border-red-400" : ""}
              />
              {errors.instagramUrl && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.instagramUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookUrl" className="flex items-center gap-1.5">
                <FaFacebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Label>
              <Input
                id="facebookUrl"
                type="url"
                {...register("facebookUrl")}
                placeholder="https://facebook.com/taofloral"
                disabled={isLoading}
                className={errors.facebookUrl ? "border-red-400" : ""}
              />
              {errors.facebookUrl && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.facebookUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktokUrl" className="flex items-center gap-1.5">
                <FaTiktok className="h-4 w-4 text-stone-800" />
                TikTok
              </Label>
              <Input
                id="tiktokUrl"
                type="url"
                {...register("tiktokUrl")}
                placeholder="https://tiktok.com/@tao.floral"
                disabled={isLoading}
                className={errors.tiktokUrl ? "border-red-400" : ""}
              />
              {errors.tiktokUrl && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.tiktokUrl.message}
                </p>
              )}
            </div>
          </div>
        </CardSection>

        {/* Imágenes Promocionales */}
        <CardSection title="Imágenes Promocionales" icon={ImageIcon}>
          <div className="space-y-6">
            <ImagePreviewCard
              label="Imagen Hero (Home)"
              value={watchedHeroUrl ?? ""}
              onChange={(val) => setValue("imagenHeroUrl", val)}
              disabled={isLoading}
              placeholder="https://ik.imagekit.io/tao/hero.jpg"
            />
            <div className="border-t border-stone-100" />
            <ImagePreviewCard
              label="Imagen Banner"
              value={watchedBannerUrl ?? ""}
              onChange={(val) => setValue("imagenBannerUrl", val)}
              disabled={isLoading}
              placeholder="https://ik.imagekit.io/tao/banner.jpg"
            />
          </div>
        </CardSection>

        {/* Acciones */}
        <div className="sticky bottom-0 -mx-6 -mb-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent px-6 pb-6 pt-8">
          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[180px] bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </form>

      {/* Integración Meta */}
      <Card className="border-t-4 border-t-[var(--color-brand-sage)]">
        <div className="flex items-center gap-2 px-6 pt-5 pb-0">
          <Globe className="h-5 w-5 text-[var(--color-brand-sage)]" />
          <h2 className="text-lg font-semibold text-stone-800">
            Integración Meta Business
          </h2>
        </div>
        <CardContent className="pt-4">
          <p className="mb-4 text-sm text-stone-500">
            Copia este enlace y pégalo en tu Administrador de Ventas de Meta
            para sincronizar tu catálogo de productos automáticamente.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={metaFeedUrl}
              className="flex-1 font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyMetaFeed}
              title="Copiar enlace"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
