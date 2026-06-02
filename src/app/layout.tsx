import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "🌸 Floristería | E-Commerce",
  description: "Envía emociones y acorta distancias con nuestros hermosos arreglos florales.",
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
      </body>
    </html>
  );
}
