import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${apiUrl}/api/v1/configuracion`, {
      next: { revalidate: 3600 },
    });
    const config = await res.json();

    const nombre = config?.nombreSitio || "TAO Boutique Floral";
    const tagline = config?.tagline || "Flores que cuentan historias";
    const descripcion =
      config?.descripcion ||
      "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada para cada ocasión especial.";
    const logoUrl = config?.logoUrl || "/tao-logo.png";
    const iconUrl = config?.iconUrl || "/tao-logo-icon.png";

    return {
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
        title: nombre,
        description: descripcion,
        url: process.env.NEXT_PUBLIC_URL,
        siteName: nombre,
        images: [
          {
            url: logoUrl,
            width: 500,
            height: 500,
            alt: nombre,
          },
        ],
        locale: "es_CO",
        type: "website",
      },
      icons: {
        icon: iconUrl,
        apple: iconUrl,
      },
    };
  } catch {
    return {
      title: {
        default: "TAO Boutique Floral | Flores que cuentan historias",
        template: "%s | TAO Boutique Floral",
      },
      description:
        "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada para cada ocasión especial.",
    };
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
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
