"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, mounted } = useAuth()
  const router = useRouter()

  // Redirect if user is already logged in
  useEffect(() => {
    if (mounted && user) {
      router.push("/")
    }
  }, [mounted, user, router])

  // Don't render anything until we know the auth state
  if (!mounted) {
    return null
  }

  // If user is logged in, don't show the login form
  if (user) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        let errorMessage = "Ocurrió un error al iniciar sesión"
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email o contraseña incorrectos"
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor confirma tu email antes de iniciar sesión"
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Demasiados intentos. Intenta de nuevo más tarde"
        }
        throw new Error(errorMessage)
      }

      // Check if user is banned after successful login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log("[LOGIN] Checking ban status for user:", user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('banned, ban_reason')
          .eq('id', user.id)
          .single()

        console.log("[LOGIN] Profile check result:", { profile, profileError })

        if (profileError) {
          console.error('Error checking user ban status:', profileError)
        } else if (profile?.banned) {
          console.log("[LOGIN] User is banned, signing out")
          // Sign out the banned user immediately
          await supabase.auth.signOut()
          // Redirect to banned page with reason
          const url = new URL('/auth/banned', window.location.origin)
          if (profile.ban_reason) {
            url.searchParams.set('reason', profile.ban_reason)
          }
          window.location.href = url.toString()
          return
        } else {
          console.log("[LOGIN] User is not banned, proceeding")
        }
      }

      router.push("/")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                <CardDescription>Ingresa tu email y contraseña para acceder a tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                        </Button>
                      </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/auth/sign-up" className="underline underline-offset-4 text-primary">
                      Regístrate
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
