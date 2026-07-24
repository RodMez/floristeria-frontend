"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginRequest } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginData: LoginRequest = { email, password };
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("Credenciales inválidas");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let serverMessage: string | null = null;
        try {
          const parsed = JSON.parse(errorText);
          serverMessage = parsed.mensaje || parsed.message;
        } catch {}

        if (response.status >= 500) {
          toast.error("El correo o la contraseña no son correctos. Por favor, verifica tus datos e intenta de nuevo.");
        } else if (serverMessage) {
          toast.error(serverMessage);
        } else {
          toast.error(`Ocurrió un error inesperado (código ${response.status}).`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setAuth(data);
      router.push("/admin");
    } catch {
      toast.error("No pudimos conectar con el servidor. Revisa tu conexión a internet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1e5e2] via-white to-[#f1e5e2] p-6">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="relative w-28 h-28 mx-auto rounded-2xl bg-white shadow-lg mb-6 overflow-hidden p-2">
            <Image
              src={logoUrl}
              alt={sitioNombre}
              fill
              className="object-contain"
              sizes="112px"
              priority
            />
          </div>
          <h1 className="font-heading text-3xl font-bold text-stone-800 mb-2">
            Panel de Administración
          </h1>
          <p className="text-stone-500">Acceso restringido a personal autorizado</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#EAC3BD]/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-700 font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@floristeria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#EAC3BD] focus:border-[#d4a49e] focus:ring-[#d4a49e]/20 bg-[#f1e5e2]/30 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-stone-700 font-medium">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#EAC3BD] focus:border-[#d4a49e] focus:ring-[#d4a49e]/20 bg-[#f1e5e2]/30 h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#d4a49e] hover:bg-[#d4a49e]/90 text-white font-bold text-base transition-all duration-200"
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

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/tienda"
            className="text-sm text-[#E5BE6F] hover:text-[#d4af5c] font-medium transition-colors"
          >
            ← Volver a la tienda
          </a>
        </div>
      </div>
    </div>
  );
}
