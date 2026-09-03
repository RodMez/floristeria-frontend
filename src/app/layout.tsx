import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import SessionExpiredListener from "@/components/auth/SessionExpiredListener";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const DEFAULT_METADATA: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: {
    default: "TAO Boutique Floral | Flores que cuentan historias",
    template: "%s | TAO Boutique Floral",
  },
  description:
    "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada para cada ocasión especial.",
  keywords: [
    "floristería",
    "arreglos florales",
    "TAO Boutique Floral",
    "flores a domicilio",
    "flores bogotá",
    "ramo de flores",
  ],
  authors: [{ name: "TAO Boutique Floral" }],
  openGraph: {
    title: "TAO Boutique Floral",
    description:
      "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada para cada ocasión especial.",
    url: process.env.NEXT_PUBLIC_URL,
    siteName: "TAO Boutique Floral",
    images: [
      {
        url: "/tao-logo.png",
        width: 500,
        height: 500,
        alt: "TAO Boutique Floral",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return DEFAULT_METADATA;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${apiUrl}/api/v1/configuracion`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) return DEFAULT_METADATA;
    const config = await res.json();

    const nombre = config?.nombreSitio || "TAO Boutique Floral";
    const tagline = config?.tagline || "Flores que cuentan historias";
    const descripcion = config?.descripcion || DEFAULT_METADATA.description!;
    const logoUrl = config?.logoUrl || "/tao-logo.png";

    return {
      ...DEFAULT_METADATA,
      title: {
        default: `${nombre} | ${tagline}`,
        template: `%s | ${nombre}`,
      },
      description: descripcion,
      keywords: [
        "floristería",
        "arreglos florales",
        nombre,
        "flores a domicilio",
        "flores bogotá",
        "ramo de flores",
      ],
      authors: [{ name: nombre }],
      openGraph: {
        ...DEFAULT_METADATA.openGraph,
        title: nombre,
        description: descripcion,
        siteName: nombre,
        images: [
          {
            url: logoUrl,
            width: 500,
            height: 500,
            alt: nombre,
          },
        ],
      },
      // icons estáticos (favicon) — no usar iconUrl dinámico para evitar 48x48 borroso y CORS con nosniff
    };
  } catch {
    return DEFAULT_METADATA;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cinzel.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SessionExpiredListener />
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
