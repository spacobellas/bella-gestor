import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToasterRadix } from "@/components/ui/toaster";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bella Gestor",
  description:
    "Sistema de gerenciamento para salões de beleza e clínicas de estética",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster position="top-right" richColors />
            <ToasterRadix />
          </DataProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
