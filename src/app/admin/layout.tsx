"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LogOut, Package, ClipboardList, Flower2, Tags, Building2, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { rol, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/admin/inventario", label: "Inventario", icon: Package },
    { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  ];

  const superAdminItems = [
    { href: "/admin/productos", label: "Productos", icon: Flower2 },
    { href: "/admin/categorias", label: "Categorías", icon: Tags },
    { href: "/admin/sedes", label: "Sedes", icon: Building2 },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-white flex flex-col">
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
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
