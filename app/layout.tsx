import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/layout/main-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export const metadata: Metadata = {
  title: "American School of Management",
  description: "Sistema de Gestión Académica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <Suspense fallback={<div>Cargando...</div>}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <PermissionsProvider>
                <MainLayout>{children}</MainLayout>
              </PermissionsProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

