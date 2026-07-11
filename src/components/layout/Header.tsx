"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import CartDrawer from "@/components/cart/CartDrawer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ConfiguracionTiendaDTO } from "@/types";
import { useEffect, useState, useRef } from "react";
import { Menu, User, LogOut, Package } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, nombre, rol, isHydrated, logout } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  const { data: config } = useSWR<ConfiguracionTiendaDTO>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/configuracion`,
    fetcher
  );

  const sitioNombre = config?.nombreSitio || "TAO Boutique Floral";
  const logoUrl = config?.logoUrl || "/tao-logo-header.png";
  const sitiNombreParts = sitioNombre.split(" ");
  const nombreBase = sitiNombreParts[0];
  const nombreAcento = sitiNombreParts.slice(1).join(" ");

  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const SCROLL_THRESHOLD = 50;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 10);

      if (currentY > SCROLL_THRESHOLD && currentY > lastScrollY.current) {
        setHidden(true);
      } else if (currentY < lastScrollY.current) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/tienda");
  };

  const isCliente = isHydrated && isAuthenticated && rol === "CLIENTE";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-background border-b border-border"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ───────────────────────────────────────────── */}
        <Link
          href="/tienda"
          className="flex items-center gap-2"
        >
          <img
            src={logoUrl}
            alt={sitioNombre}
            className="h-11 w-11 rounded-full"
          />
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 sm:text-2xl">
            {nombreBase}{nombreAcento && <span className="text-brand-mustard"> {nombreAcento}</span>}
          </span>
        </Link>

        {/* ── Desktop Nav ────────────────────────────────────── */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link
            href="/tienda"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Inicio
          </Link>
          <Link
            href="/tienda/nosotros"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Nosotros
          </Link>
          <Link
            href="/tienda"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Catálogo
          </Link>
        </nav>

        {/* ── Right Section ──────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ── Theme Toggle ──────────────────────────────────── */}
          <ThemeToggle />

          {/* Auth — Desktop */}
          <div className="hidden md:block">
            {isCliente ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <User className="size-4" />
                  <span className="font-heading max-w-[240px] truncate">{nombre || "Mi cuenta"}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <User className="size-4" />
                      Mi cuenta
                    </Link>
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Package className="size-4" />
                      Mis pedidos
                    </Link>
                    <Separator className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/tienda/auth"
                className="inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border-border bg-background px-2.5 text-[0.8rem] font-heading font-medium text-muted-foreground whitespace-nowrap transition-all hover:border-brand-mustard hover:text-brand-mustard"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* ── Cart ──────────────────────────────────────────── */}
          <div className="relative">
            <CartDrawer />
            {isMounted && totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {totalItems}
              </Badge>
            )}
          </div>

          {/* ── Mobile Menu ──────────────────────────────────── */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent className="w-72 sm:w-80">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="font-heading text-base font-semibold text-foreground">
                    {nombreBase}{nombreAcento && <span className="text-brand-mustard"> {nombreAcento}</span>}
                  </span>
                </div>

                <nav className="flex-1 space-y-1 py-6">
                  <Link
                    href="/tienda"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Inicio
                  </Link>
                  <Link
                    href="/tienda/nosotros"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Nosotros
                  </Link>
                  <Link
                    href="/tienda"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Catálogo
                  </Link>
                </nav>

                <Separator className="mb-4" />
                {isCliente ? (
                  <div className="space-y-1">
                    <p className="px-3 font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {nombre || "Mi cuenta"}
                    </p>
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <User className="size-4" />
                      Mi cuenta
                    </Link>
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Package className="size-4" />
                      Mis pedidos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/tienda/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-border bg-background px-2.5 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap transition-all hover:border-brand-mustard hover:text-brand-mustard"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/tienda/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-mustard px-2.5 py-2 text-sm font-medium text-stone-900 whitespace-nowrap transition-all hover:bg-brand-mustard-dark"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
