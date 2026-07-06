import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
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
    title: "TAO Boutique Floral | Flores que cuentan historias",
    description:
      "Transformamos flores en experiencias inolvidables. Diseños exclusivos, flores frescas y atención personalizada.",
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
    icon: "/tao-logo-icon.png",
    apple: "/tao-logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
