import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
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
                <p className="text-sm text-muted-foreground">Cuenta creada</p>
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
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">¡Cuenta creada exitosamente!</CardTitle>
                <CardDescription>Revisa tu email para confirmar tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground text-pretty">
                  Te hemos enviado un email de confirmación. Haz clic en el enlace del email para activar tu cuenta y
                  poder iniciar sesión.
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Ir a iniciar sesión</Link>
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
