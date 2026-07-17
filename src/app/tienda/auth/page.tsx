"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { loginCliente, registerCliente } from "@/lib/fetcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(10, "Teléfono inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  aceptaDatos: z.literal(true, { message: "Debes aceptar la política de datos" }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function AuthContent() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setClienteAuth } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const isSafeRedirect = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://");
  const redirectTo = isSafeRedirect ? rawRedirect : (items.length > 0 ? "/tienda/checkout" : "/tienda");

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const tagline = config?.tagline || "Flores que cuentan historias";
  const descripcion = config?.descripcion || "Creamos momentos únicos con flores frescas y arreglos personalizados. Cada pétalo cuenta una historia, cada bouquet lleva un mensaje de amor.";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      password: "",
      aceptaDatos: undefined as unknown as true,
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await loginCliente(data.email, data.password);
      setClienteAuth(response);
      toast.success(`¡Bienvenido, ${response.nombre}!`);
      router.replace(redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await registerCliente(data);
      setClienteAuth(response);
      toast.success(`¡Bienvenido, ${response.nombre}! Tu cuenta ha sido creada.`);
      router.replace(redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative pattern */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EAC3BD] via-[#E5BE6F] to-[#d4a49e]" />
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
            <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.2" />
            <circle cx="300" cy="200" r="120" fill="white" fillOpacity="0.15" />
            <circle cx="150" cy="350" r="60" fill="white" fillOpacity="0.25" />
            <circle cx="350" cy="50" r="40" fill="white" fillOpacity="0.3" />
            <path d="M50 200 Q200 100 350 200 Q200 300 50 200" fill="white" fillOpacity="0.1" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <div className="relative w-64 h-64 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 overflow-hidden p-4">
            <Image
              src={logoUrl}
              alt={sitioNombre}
              fill
              className="object-contain"
              sizes="256px"
              priority
            />
          </div>
          <h2 className="font-heading text-4xl font-bold text-white mb-3">{sitioNombre}</h2>
          <p className="text-white/80 text-xl font-heading mb-6">{tagline}</p>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">{descripcion}</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center bg-[#f1e5e2] p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="relative w-16 h-16 rounded-full bg-[#EAC3BD] flex items-center justify-center overflow-hidden">
              <Image
                src={logoUrl}
                alt={sitioNombre}
                fill
                className="object-contain p-1.5"
                sizes="64px"
              />
            </div>
            <span className="font-heading text-xl font-semibold text-stone-800">
              {sitioNombre}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex bg-white rounded-xl p-1 mb-8 shadow-sm">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-[var(--color-brand-mustard)]/15 text-[var(--color-brand-mustard-dark)]"
                  : "text-stone-500 hover:bg-[var(--color-brand-rose-light)]/40 hover:text-stone-700"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-[var(--color-brand-mustard)]/15 text-[var(--color-brand-mustard-dark)]"
                  : "text-stone-500 hover:bg-[var(--color-brand-rose-light)]/40 hover:text-stone-700"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-2xl font-bold text-stone-800 mb-2">Bienvenido de vuelta</h1>
                <p className="text-stone-500">Ingresa tus datos para acceder a tu cuenta</p>
              </div>

              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-stone-700 font-medium">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="cliente@email.com"
                    className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12"
                    {...loginForm.register("email")}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-stone-700 font-medium">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12 pr-12"
                      {...loginForm.register("password")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <button type="button" className="text-sm text-[#E5BE6F] hover:text-[#d4af5c] font-medium transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-rose-dark hover:bg-brand-mustard text-white hover:text-stone-900 font-bold text-base transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-2xl font-bold text-stone-800 mb-2">Crea tu cuenta</h1>
                <p className="text-stone-500">Regístrate para realizar tus pedidos</p>
              </div>

              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nombre" className="text-stone-700 font-medium">Nombre completo</Label>
                  <Input
                    id="register-nombre"
                    type="text"
                    placeholder="Juan Pérez"
                    className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12"
                    {...registerForm.register("nombre")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.nombre && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-stone-700 font-medium">Correo electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="cliente@email.com"
                    className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12"
                    {...registerForm.register("email")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-telefono" className="text-stone-700 font-medium">Teléfono</Label>
                  <Input
                    id="register-telefono"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12"
                    {...registerForm.register("telefono")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.telefono && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.telefono.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-stone-700 font-medium">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="border-[#EAC3BD] focus:border-[#E5BE6F] focus:ring-[#E5BE6F]/20 bg-white h-12 pr-12"
                      {...registerForm.register("password")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="register-acepta-datos"
                    checked={!!registerForm.watch("aceptaDatos")}
                    onCheckedChange={(checked) =>
                      registerForm.setValue("aceptaDatos", (checked ? true : undefined) as unknown as true, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isLoading}
                    className="border-[#EAC3BD] data-[state=checked]:bg-[#E5BE6F] data-[state=checked]:border-[#E5BE6F] mt-0.5"
                  />
                  <Label htmlFor="register-acepta-datos" className="text-sm text-stone-600 leading-snug cursor-pointer">
                    Acepto la{" "}
                    <a href="/legal/datos" target="_blank" className="underline text-[#E5BE6F] hover:text-[#d4af5c] font-medium">
                      Política de Tratamiento de Datos Personales
                    </a>
                  </Label>
                </div>
                {registerForm.formState.errors.aceptaDatos && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.aceptaDatos.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-rose-dark hover:bg-brand-mustard text-white hover:text-stone-900 font-bold text-base transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-stone-500 mt-8">
            {activeTab === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button onClick={() => setActiveTab("register")} className="text-[#E5BE6F] hover:text-[#d4af5c] font-bold transition-colors">
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setActiveTab("login")} className="text-[#E5BE6F] hover:text-[#d4af5c] font-bold transition-colors">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f1e5e2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E5BE6F]" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
