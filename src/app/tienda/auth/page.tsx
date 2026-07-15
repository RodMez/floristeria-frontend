"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { loginCliente, registerCliente } from "@/lib/fetcher";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Schema de validación para Login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Schema de validación para Registro
const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(10, "Teléfono inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  aceptaDatos: z.literal(true, { message: "Debes aceptar la política de datos" }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function AuthContent() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const { setClienteAuth } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const isSafeRedirect = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://");
  const redirectTo = isSafeRedirect ? rawRedirect : (items.length > 0 ? "/tienda/checkout" : "/tienda");

  // Formulario de Login
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Formulario de Registro
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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Floristería</CardTitle>
          <CardDescription>Accede a tu cuenta o crea una nueva</CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form method="POST" onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="cliente@email.com"
                    {...loginForm.register("email")}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form method="POST" onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nombre">Nombre completo</Label>
                  <Input
                    id="register-nombre"
                    type="text"
                    placeholder="Juan Pérez"
                    {...registerForm.register("nombre")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.nombre && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Correo electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="cliente@email.com"
                    {...registerForm.register("email")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-telefono">Teléfono</Label>
                  <Input
                    id="register-telefono"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    {...registerForm.register("telefono")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.telefono && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.telefono.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register("password")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="register-acepta-datos"
                    checked={!!registerForm.watch("aceptaDatos")}
                    onCheckedChange={(checked) =>
                      registerForm.setValue("aceptaDatos", (checked ? true : undefined) as unknown as true, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="register-acepta-datos" className="text-sm font-normal leading-snug cursor-pointer">
                    Acepto la{" "}
                    <a href="/legal/datos" target="_blank" className="underline text-primary hover:text-primary/80">
                      Política de Tratamiento de Datos Personales
                    </a>
                  </Label>
                </div>
                {registerForm.formState.errors.aceptaDatos && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.aceptaDatos.message}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Crear cuenta"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">Cargando...</div>}>
      <AuthContent />
    </Suspense>
  );
}