"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginRequest } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

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
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al panel de administración</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@floristeria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
