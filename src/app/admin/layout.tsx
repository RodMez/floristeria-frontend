"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { ConfiguracionTiendaDTO } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type IconType = typeof LayoutDashboard;

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  hint?: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { rol, logout, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${API_URL}/api/v1/configuracion`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/tienda/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleLogout = () => {
    closeSidebar();
    logout();
    router.push("/tienda/login");
  };

  const navItems: NavItem[] = [
    { href: "/admin", label: "Pedidos Activos", icon: LayoutDashboard, hint: "Centro de comando" },
    { href: "/admin/inventario", label: "Inventario", icon: Package, hint: "Stock por sede" },
    { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, hint: "Historial completo" },
    { href: "/admin/zonas-domicilio", label: "Domicilios", icon: MapPin, hint: "Cobertura" },
  ];

  const superAdminItems: NavItem[] = [
    { href: "/admin/productos", label: "Productos", icon: Flower2 },
    { href: "/admin/categorias", label: "Categorías", icon: Tags },
    { href: "/admin/sedes", label: "Sedes", icon: Building2 },
    { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    { href: "/admin/resenas", label: "Reseñas", icon: MessageSquare },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  ];

  const sitioNombreParts = sitioNombre.split(" ").filter(Boolean);
  const nombreBase = sitioNombreParts.slice(0, -1).join(" ");
  const nombreAcento = sitioNombreParts[sitioNombreParts.length - 1] ?? "";

  const renderNavItem = (item: NavItem, key: string) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <li key={key}>
        <Link
          href={item.href}
          onClick={closeSidebar}
          aria-current={isActive ? "page" : undefined}
          className={`
            group relative flex items-center gap-3 rounded-lg px-3 py-2.5
            font-heading text-sm tracking-wide
            transition-all duration-200 ease-out
            ${
              isActive
                ? "bg-[var(--admin-sidebar-hover)] text-[var(--admin-sidebar-foreground)] shadow-[inset_0_0_0_1px_var(--admin-sidebar-border)]"
                : "text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--admin-sidebar-foreground)]"
            }
          `}
        >
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-[var(--admin-accent)]"
            />
          )}
          <Icon
            className={`h-[18px] w-[18px] shrink-0 transition-colors ${
              isActive
                ? "text-[var(--admin-accent)]"
                : "text-[var(--admin-sidebar-muted)] group-hover:text-[var(--admin-sidebar-foreground)]"
            }`}
          />
          <span className="truncate">{item.label}</span>
          {isActive && (
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--admin-accent)]" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--admin-canvas)]">
        {/* ── Mobile top bar ───────────────────────────────── */}
        <header
          className="
            md:hidden fixed top-0 left-0 right-0 z-30
            flex items-center justify-between
            px-4 h-16
            bg-[var(--admin-sidebar)]
            text-[var(--admin-sidebar-foreground)]
            shadow-[0_1px_0_0_var(--admin-sidebar-border)]
          "
        >
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoUrl}
              alt={sitioNombre}
              className="h-9 w-9 rounded-full ring-2 ring-[var(--admin-accent)]/70 object-cover shadow-[0_0_0_3px_var(--admin-sidebar)] shrink-0"
            />
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold truncate">
                {nombreBase}
                {nombreAcento && (
                  <span className="text-[var(--admin-accent)]"> {nombreAcento}</span>
                )}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--admin-sidebar-muted)]">
                Panel Admin
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--admin-sidebar-foreground)] hover:bg-[var(--admin-sidebar-hover)]"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* ── Overlay (móvil) ─────────────────────────────── */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="md:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-opacity"
            onClick={closeSidebar}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside
          aria-label="Navegación del panel"
          className={`
            w-72 shrink-0
            bg-[var(--admin-sidebar)]
            text-[var(--admin-sidebar-foreground)]
            flex flex-col
            fixed inset-y-0 left-0 z-50
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0 md:z-auto
            shadow-[1px_0_0_0_var(--admin-sidebar-border)]
          `}
        >
          {/* Brand header */}
          <div className="relative flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--admin-sidebar-border)]">
            <Link href="/admin" className="flex items-center gap-3 min-w-0 group">
              <img
                src={logoUrl}
                alt={sitioNombre}
                className="h-11 w-11 rounded-full ring-2 ring-[var(--admin-accent)]/70 object-cover shadow-[0_0_0_3px_var(--admin-sidebar)] transition-transform group-hover:scale-105 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-heading text-base font-semibold truncate leading-tight">
                  {nombreBase}
                  {nombreAcento && (
                    <span className="text-[var(--admin-accent)]"> {nombreAcento}</span>
                  )}
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--admin-sidebar-muted)] mt-0.5">
                  Panel Admin
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--admin-sidebar-foreground)]"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User role pill */}
          {rol && (
            <div className="px-5 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-accent)]/40 bg-[var(--admin-accent)]/15 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--admin-accent)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--admin-accent)]">
                  {rol === "SUPERADMIN" ? "Super Admin" : "Admin de sede"}
                </span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-sidebar-muted)]">
              Operación
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => renderNavItem(item, item.href))}
            </ul>

            {rol === "SUPERADMIN" && (
              <>
                <Separator className="my-5 bg-[var(--admin-sidebar-border)]" />
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-sidebar-muted)]">
                  Configuración
                </p>
                <ul className="space-y-1">
                  {superAdminItems.map((item) => renderNavItem(item, item.href))}
                </ul>
              </>
            )}
          </nav>

          {/* Footer: logout */}
          <div className="border-t border-[var(--admin-sidebar-border)] p-4">
            <Button
              variant="ghost"
              className="
                w-full justify-start gap-2
                text-[var(--admin-sidebar-muted)]
                hover:bg-[var(--admin-danger)]/15
                hover:text-[var(--admin-danger)]
              "
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="font-heading text-sm">Cerrar Sesión</span>
            </Button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 pt-20 md:p-8 md:pt-8">
          {children}
        </main>
      </div>
  );
}
