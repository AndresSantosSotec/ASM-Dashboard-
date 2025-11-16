import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import MainLayout from "@/components/layout/main-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"


export const metadata: Metadata = {
  title: "American School of Management",
  description: "Sistema de Gestión Académica",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/ASM.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/ASM.ico",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <Suspense fallback={<div>Cargando...</div>}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <MainLayout>{children}</MainLayout>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
