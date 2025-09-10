"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ban, Home } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function BannedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">Cuenta Suspendida</CardTitle>
              <CardDescription>
                Tu cuenta ha sido suspendida y no puedes acceder al sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reason && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="font-medium text-destructive mb-2">Razón de la suspensión:</h4>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Si consideras que esto es un error, puedes contactar al equipo de soporte
                  para revisar tu caso.
                </p>
                <p className="font-medium">
                  Email de soporte: soporte@patitasconectadas.com
                </p>
              </div>

              <div className="pt-4">
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function BannedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    }>
      <BannedContent />
    </Suspense>
  )
}