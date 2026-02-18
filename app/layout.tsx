import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import MainLayout from "@/components/layout/main-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { CustomizationProvider } from "@/contexts/CustomizationContext"
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: "Gaia Business School",
  description: "Sistema de Gestión Académica",
  icons: {
    icon: [
      { url: "/webpanel/icons/ASM.ico" },
    ],
    shortcut: "/webpanel/icons/ASM.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#0c1220]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-gaia-wine/30 border-t-gaia-wine rounded-full animate-spin" />
              <p className="text-sm text-gaia-navy/60 dark:text-gaia-light/50 font-medium">Cargando...</p>
            </div>
          </div>
        }>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <CustomizationProvider>
                <MainLayout>{children}</MainLayout>
              </CustomizationProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  )
}
