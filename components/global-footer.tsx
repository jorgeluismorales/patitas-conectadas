"use client"

import { PawPrint } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export function GlobalFooter() {
  const { user, mounted } = useAuth()

  if (!mounted) {
    return null
  }

  return (
    <footer className="border-t bg-card mt-auto">
      {/* Mobile Logo Section - Only visible on mobile */}
      <div className="md:hidden border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Patitas Conectadas</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Desktop Layout - Only login buttons if user not authenticated */}
        <div className="hidden md:block">
          {!user && (
            <div className="flex items-center justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Layout - Logo, text, description and login buttons */}
        <div className="md:hidden space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <p className="text-sm text-muted-foreground">Reuniendo mascotas con sus familias</p>
            
            {!user && (
              <div className="flex flex-col w-full max-w-xs gap-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm" className="w-full">
                  <Link href="/auth/sign-up">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground space-y-1">
          <p>© 2024 Patitas Conectadas. Plataforma colaborativa.</p>
          <p>Recuerda siempre coordinar encuentros en lugares públicos y seguros.</p>
        </div>
      </div>
    </footer>
  )
}
