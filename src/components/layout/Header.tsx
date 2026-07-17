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
import { Menu, User, LogOut, Package, Home, Users, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, nombre, rol, isHydrated, logout } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const sedeActual = useCartStore((state) => state.sedeActual);
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
          ? "bg-[var(--color-brand-rose-light)]/90 backdrop-blur-md shadow-sm border-b border-[var(--color-brand-rose)]"
          : "bg-[var(--color-brand-rose-light)] border-b border-[var(--color-brand-rose)]"
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
            className="h-14 w-14 rounded-full"
          />
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 sm:text-2xl">
            {nombreBase}{nombreAcento && <span className="text-brand-mustard"> {nombreAcento}</span>}
          </span>
        </Link>

        {/* ── Desktop Nav ────────────────────────────────────── */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link
            href="/tienda"
            className="text-sm font-bold text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Inicio
          </Link>
          <Link
            href="/tienda/nosotros"
            className="text-sm font-bold text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Nosotros
          </Link>
          <button
            onClick={() => {
              if (sedeActual) {
                router.push(`/tienda/sede/${sedeActual.id}`);
              } else {
                router.push("/tienda");
              }
            }}
            className="text-sm font-bold text-muted-foreground transition-colors hover:text-brand-mustard"
          >
            Catálogo
          </button>
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
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold text-brand-mustard transition-colors hover:text-brand-mustard-dark"
                >
                  <User className="size-4" />
                  <span className="font-heading font-bold max-w-[240px] truncate text-base">{nombre || "Mi cuenta"}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-brand-mustard"
                    >
                      <User className="size-4" />
                      Mi cuenta
                    </Link>
                    <Link
                      href="/tienda/mi-cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-brand-mustard"
                    >
                      <Package className="size-4" />
                      Mis pedidos
                    </Link>
                    <Separator className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-brand-mustard"
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
                className="inline-flex h-8 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border-[var(--color-brand-rose)] bg-[var(--color-brand-rose-light)]/50 px-3 text-sm font-heading font-bold text-brand-mustard whitespace-nowrap transition-all hover:border-brand-mustard hover:text-brand-mustard-dark"
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
            <SheetContent className="w-72 sm:w-80 p-0">
              <div className="flex h-full flex-col px-6">
                <div className="flex items-center justify-between border-b border-[var(--color-brand-rose)]/20 pt-6 pb-4 -mx-6 px-6">
                  <span className="font-heading text-base font-semibold text-[var(--color-brand-mustard-dark)]">
                    {nombreBase}{nombreAcento && <span className="text-[var(--color-brand-mustard)]"> {nombreAcento}</span>}
                  </span>
                </div>

                <nav className="space-y-1 pt-4 pb-2">
                  <Link
                    href="/tienda"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-[var(--color-brand-mustard)]/15 hover:text-[var(--color-brand-mustard-dark)]"
                  >
                    <Home className="size-5 text-[var(--color-brand-rose-dark)]" />
                    Inicio
                  </Link>
                  <Link
                    href="/tienda/nosotros"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-[var(--color-brand-mustard)]/15 hover:text-[var(--color-brand-mustard-dark)]"
                  >
                    <Users className="size-5 text-[var(--color-brand-rose-dark)]" />
                    Nosotros
                  </Link>
                  <button
                    onClick={() => {
                      if (sedeActual) {
                        router.push(`/tienda/sede/${sedeActual.id}`);
                      } else {
                        router.push("/tienda");
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-[var(--color-brand-mustard)]/15 hover:text-[var(--color-brand-mustard-dark)]"
                  >
                    <ShoppingBag className="size-5 text-[var(--color-brand-rose-dark)]" />
                    Catálogo
                  </button>
                </nav>

                <div className="border-t border-[var(--color-brand-rose)]/20 pt-4 pb-6 -mx-6 px-6 mt-auto">
                  {isCliente ? (
                    <>
                      <div className="mb-4 rounded-xl bg-[var(--color-brand-rose-light)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-[var(--color-brand-mustard)] flex items-center justify-center shrink-0 shadow-sm">
                            <span className="font-heading text-base font-bold text-stone-900">
                              {(nombre || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-[var(--color-brand-mustard-dark)] text-sm truncate">{nombre}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/tienda/mi-cuenta"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-stone-600 transition-colors hover:bg-[var(--color-brand-mustard)]/15 hover:text-[var(--color-brand-mustard-dark)]"
                        >
                          <User className="size-5 text-[var(--color-brand-rose-dark)]" />
                          Mi cuenta
                        </Link>
                        <Link
                          href="/tienda/mi-cuenta"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-stone-600 transition-colors hover:bg-[var(--color-brand-mustard)]/15 hover:text-[var(--color-brand-mustard-dark)]"
                        >
                          <Package className="size-5 text-[var(--color-brand-rose-dark)]" />
                          Mis pedidos
                        </Link>
                        <div className="border-t border-[var(--color-brand-rose)]/10 my-2" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <LogOut className="size-5" />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/tienda/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-brand-rose)] bg-[var(--color-brand-rose-light)]/50 px-2.5 py-2.5 text-base font-bold text-stone-700 transition-all hover:border-[var(--color-brand-mustard)] hover:text-[var(--color-brand-mustard-dark)]"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/tienda/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand-mustard)] px-2.5 py-2.5 text-base font-bold text-stone-900 transition-all hover:bg-[var(--color-brand-mustard-dark)]"
                      >
                        Registrarse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
