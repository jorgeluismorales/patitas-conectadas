import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { GlobalHeader } from "@/components/global-header"
import { GlobalFooter } from "@/components/global-footer"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Patitas Conectadas - Encuentra a tu mascota perdida",
  description: "Plataforma para conectar personas que encontraron mascotas con quienes las perdieron",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/paw-favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png",
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
        <link rel="icon" type="image/svg+xml" href="/paw-favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <GlobalHeader />
              <main className="flex-1">
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              </main>
              <GlobalFooter />
            </div>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
