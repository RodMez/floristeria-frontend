import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Floristería",
  description: "E-Commerce Multisede de Floristería",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="bg-stone-50 text-stone-900 min-h-screen flex flex-col">
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
