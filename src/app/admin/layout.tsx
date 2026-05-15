"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { rol, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-white flex flex-col">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-bold">Panel Admin</h1>
          {rol && (
            <p className="text-sm text-stone-400 mt-1">Rol: {rol}</p>
          )}
        </div>
        <nav className="flex-1 p-4">
          {/* Espacio para menú de navegación */}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-stone-100">
        {children}
      </main>
    </div>
  );
}
