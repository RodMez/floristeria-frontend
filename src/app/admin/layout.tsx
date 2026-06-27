"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, useSessionExpiredSync } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Package,
  ClipboardList,
  Flower2,
  Tags,
  Building2,
  Users,
  Menu,
  MapPin,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { rol, logout, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sincronizar con el evento de sesión expirada del fetcher
  useSessionExpiredSync();

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    // Solo redirigir si ya se hidrató el store y no está autenticado
    if (isHydrated && !isAuthenticated) {
      router.push("/tienda/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  const handleLogout = () => {
    closeSidebar();
    logout();
    router.push("/tienda/login");
  };

  const navItems = [
    { href: "/admin/inventario", label: "Inventario", icon: Package },
    { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/admin/zonas-domicilio", label: "Domicilios", icon: MapPin },
  ];

  const superAdminItems = [
    { href: "/admin/productos", label: "Productos", icon: Flower2 },
    { href: "/admin/categorias", label: "Categorías", icon: Tags },
    { href: "/admin/sedes", label: "Sedes", icon: Building2 },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-stone-900 text-white flex items-center justify-between p-4">
        <h1 className="text-lg font-bold">Panel Admin</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-stone-800"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </header>

      {/* Overlay - solo visible en móvil cuando sidebar está abierto */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-stone-900 text-white flex flex-col
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:z-auto
        `}
      >
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-bold">Panel Admin</h1>
          {rol && (
            <p className="text-sm text-stone-400 mt-1">Rol: {rol}</p>
          )}
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-2 hover:bg-stone-800 p-2 rounded transition-colors ${
                      isActive ? "bg-stone-800" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {rol === "SUPERADMIN" &&
              superAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-2 hover:bg-stone-800 p-2 rounded transition-colors ${
                        isActive ? "bg-stone-800" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
        <div className="p-4 border-t border-stone-800 mt-auto">
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
      <main className="flex-1 overflow-y-auto p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}
