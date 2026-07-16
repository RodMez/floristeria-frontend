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
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Settings,
  Save,
  Copy,
  Mail,
  Globe,
  Tag,
  ImageIcon,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from "@/components/icons/SocialIcons";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { validateImageFile } from "@/lib/validation";
import { useRequireSuperAdmin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const configSchema = z.object({
  enviarCopiaMaestro: z.boolean(),
  correoMaestro: z.string().email("Correo inválido").optional().or(z.literal("")),
  whatsappGeneral: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  instagramUrl: z.string().url("URL inválida").max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  facebookUrl: z.string().url("URL inválida").max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  tiktokUrl: z.string().url("URL inválida").max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  nombreSitio: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  tagline: z.string().max(150, "Máximo 150 caracteres").optional().or(z.literal("")),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  logoUrl: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  iconUrl: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  historia: z.string().max(10000, "Máximo 10000 caracteres").optional().or(z.literal("")),
  mision: z.string().max(10000, "Máximo 10000 caracteres").optional().or(z.literal("")),
  vision: z.string().max(10000, "Máximo 10000 caracteres").optional().or(z.literal("")),
});

type ConfigFormData = z.infer<typeof configSchema>;

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct > 90 ? "text-red-500" : pct > 70 ? "text-amber-500" : "text-stone-400";
  return (
    <p className={`text-xs text-right ${color}`}>
      {current}/{max}
    </p>
  );
}

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

export default function ConfiguracionPage() {
  const { isLoading: isAuthLoading } = useRequireSuperAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [exportandoProductos, setExportandoProductos] = useState(false);

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
      nombreSitio: "",
      tagline: "",
      descripcion: "",
      logoUrl: "",
      iconUrl: "",
      historia: "",
      mision: "",
      vision: "",
    },
  });

  const watchedEnviarCopia = watch("enviarCopiaMaestro");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "iconUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileError = validateImageFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    const setter = field === "logoUrl" ? setUploadingLogo : setUploadingIcon;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      const res = await authFetch<{ url: string }>(
        `${API_URL}/api/superadmin/imagenes`,
        { method: "POST", body: formData }
      );
      setValue(field, res.url, { shouldValidate: true });
      toast.success(`${field === "logoUrl" ? "Logo" : "Favicon"} subido correctamente`);
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setter(false);
    }
  };

  const metaFeedUrl = `${API_URL}/api/v1/catalogo/meta-feed`;

  const handleCopyMetaFeed = () => {
    navigator.clipboard.writeText(metaFeedUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleExportExcel = async () => {
    setExportandoExcel(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${API_URL}/api/admin/pedidos/export-excel`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel exportado correctamente");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Error al exportar Excel"}`
      );
    } finally {
      setExportandoExcel(false);
    }
  };

  const handleExportProductosInventario = async () => {
    setExportandoProductos(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${API_URL}/api/admin/productos-inventario/export-excel`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `productos_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel exportado correctamente");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Error al exportar Excel"}`
      );
    } finally {
      setExportandoProductos(false);
    }
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
        nombreSitio: configuracion.nombreSitio ?? "",
        tagline: configuracion.tagline ?? "",
        descripcion: configuracion.descripcion ?? "",
        logoUrl: configuracion.logoUrl ?? "",
        iconUrl: configuracion.iconUrl ?? "",
        historia: configuracion.historia ?? "",
        mision: configuracion.mision ?? "",
        vision: configuracion.vision ?? "",
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
      nombreSitio: data.nombreSitio || null,
      tagline: data.tagline || null,
      descripcion: data.descripcion || null,
      logoUrl: data.logoUrl || null,
      iconUrl: data.iconUrl || null,
      historia: data.historia || null,
      mision: data.mision || null,
      vision: data.vision || null,
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

  if (isAuthLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-stone-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

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
          Gestiona la configuración general de la tienda
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Correo y Notificaciones + Exportar Datos */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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
          </div>

          <div className="lg:col-span-1">
            <Card className="border-t-4 border-t-[var(--color-brand-sage)] h-full">
              <div className="flex items-center gap-2 px-6 pt-5 pb-0">
                <Download className="h-5 w-5 text-[var(--color-brand-sage)]" />
                <h2 className="text-lg font-semibold text-stone-800">Exportar Datos</h2>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-stone-500 mb-4">
                  Descarga reportes de tu negocio en formato Excel.
                </p>
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exportandoExcel}
                    className="w-full justify-start bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {exportandoExcel ? "Exportando..." : "Pedidos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExportProductosInventario}
                    disabled={exportandoProductos}
                    className="w-full justify-start bg-[var(--color-brand-mustard)] text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {exportandoProductos ? "Exportando..." : "Productos + Inventario"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
                maxLength={20}
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

        {/* Marca e Identidad */}
        <CardSection title="Marca e Identidad" icon={Tag}>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nombreSitio">Nombre del sitio</Label>
              <Input
                id="nombreSitio"
                {...register("nombreSitio")}
                placeholder="TAO Boutique Floral"
                disabled={isLoading}
                maxLength={100}
              />
              <CharCounter current={watch("nombreSitio")?.length || 0} max={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Eslogan</Label>
              <Input
                id="tagline"
                {...register("tagline")}
                placeholder="Flores que cuentan historias"
                disabled={isLoading}
                maxLength={150}
              />
              <CharCounter current={watch("tagline")?.length || 0} max={150} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                {...register("descripcion")}
                placeholder="Transformamos flores en experiencias inolvidables..."
                disabled={isLoading}
                rows={3}
                maxLength={500}
              />
              <CharCounter current={watch("descripcion")?.length || 0} max={500} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="logoUrl"
                    type="text"
                    {...register("logoUrl")}
                    placeholder="URL del logo"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Label
                    htmlFor="logoUpload"
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--color-brand-mustard)] px-3 py-2 text-sm font-medium text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
                  >
                    <ImageIcon className="size-4" />
                    {uploadingLogo ? "..." : "Subir"}
                  </Label>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "logoUrl")}
                    disabled={uploadingLogo}
                  />
                </div>
                {watch("logoUrl") && (
                  <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-lg border">
                    <Image
                      src={watch("logoUrl") || ""}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="iconUrl">Favicon (ícono de pestaña)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="iconUrl"
                    type="text"
                    {...register("iconUrl")}
                    placeholder="URL del favicon"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Label
                    htmlFor="iconUpload"
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--color-brand-mustard)] px-3 py-2 text-sm font-medium text-stone-900 hover:bg-[var(--color-brand-mustard-dark)]"
                  >
                    <ImageIcon className="size-4" />
                    {uploadingIcon ? "..." : "Subir"}
                  </Label>
                  <input
                    id="iconUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "iconUrl")}
                    disabled={uploadingIcon}
                  />
                </div>
                {watch("iconUrl") && (
                  <div className="relative mt-2 h-10 w-10 overflow-hidden rounded border">
                    <Image
                      src={watch("iconUrl") || ""}
                      alt="Favicon preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="historia">Historia de la empresa</Label>
              <Textarea
                id="historia"
                {...register("historia")}
                placeholder="TAO Boutique Floral nace del arte de transformar flores..."
                disabled={isLoading}
                rows={4}
                maxLength={10000}
              />
              <CharCounter current={watch("historia")?.length || 0} max={10000} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mision">Misión</Label>
                <Textarea
                  id="mision"
                  {...register("mision")}
                  placeholder="Nuestra misión es transformar emociones..."
                  disabled={isLoading}
                  rows={4}
                  maxLength={10000}
                />
                <CharCounter current={watch("mision")?.length || 0} max={10000} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision">Visión</Label>
                <Textarea
                  id="vision"
                  {...register("vision")}
                  placeholder="Nuestra visión es consolidar..."
                  disabled={isLoading}
                  rows={4}
                  maxLength={10000}
                />
                <CharCounter current={watch("vision")?.length || 0} max={10000} />
              </div>
            </div>
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
