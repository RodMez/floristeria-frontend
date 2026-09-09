import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import SessionExpiredListener from "@/components/auth/SessionExpiredListener";
import FaviconSync from "@/components/FaviconSync";
import MetaPixelPageView from "@/components/MetaPixelPageView";
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

function getMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3000");
  }
}

const DEFAULT_METADATA: Metadata = {
  metadataBase: getMetadataBase(),
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
    url: getMetadataBase().href,
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
      next: { revalidate: 60, tags: ["config"] },
    });
    clearTimeout(timeout);

    if (!res.ok) return DEFAULT_METADATA;
    const config = await res.json();

    const nombre = config?.nombreSitio || "TAO Boutique Floral";
    const tagline = config?.tagline || "Flores que cuentan historias";
    const descripcion = config?.descripcion || DEFAULT_METADATA.description!;
    const logoUrl = config?.logoUrl || "/tao-logo.png";
    const iconUrl = (config?.iconUrl as string | undefined)?.trim() || "";

    const dynamicIcons = iconUrl
      ? {
          icons: {
            // SOLO dinamico: sin /icon.png ni /favicon.ico para que Chromium no prefiera el estatico same-origin
            icon: [{ url: iconUrl, sizes: "any" }],
            apple: [{ url: iconUrl, sizes: "180x180", type: "image/png" as const }],
            shortcut: iconUrl,
          },
        }
      : {};

    return {
      ...DEFAULT_METADATA,
      ...dynamicIcons,
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="es" className={`${cinzel.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        {metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${metaPixelId}');fbq('track', 'PageView');`}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
            <MetaPixelPageView />
          </>
        ) : null}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SessionExpiredListener />
          <FaviconSync />
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
