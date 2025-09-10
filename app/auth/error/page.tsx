import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const params = await searchParams

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case "access_denied":
        return "Acceso denegado. No tienes permisos para acceder a este recurso."
      case "server_error":
        return "Error del servidor. Inténtalo de nuevo más tarde."
      case "temporarily_unavailable":
        return "Servicio temporalmente no disponible. Inténtalo de nuevo más tarde."
      default:
        return "Ocurrió un error inesperado durante la autenticación."
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver al inicio</span>
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Patitas Conectadas</h1>
                <p className="text-sm text-muted-foreground">Error de autenticación</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Error de autenticación</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground text-pretty">{getErrorMessage(params?.error)}</p>
                {params?.error && <p className="text-xs text-muted-foreground">Código de error: {params.error}</p>}
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Intentar de nuevo</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/">Volver al inicio</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
