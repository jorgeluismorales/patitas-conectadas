"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useIsomorphicLayoutEffect } from "@/hooks/use-mounted"
import { Button } from "@/components/ui/button"
import { Plus, PawPrint, LogOut, User, Settings, Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GlobalHeader() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useIsomorphicLayoutEffect()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!mounted) return

    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!error && user) {
          setUser(user)
          
          // Check if user is admin
          const { data: adminUser, error: adminError } = await supabase
            .from("admin_users")
            .select("role")
            .eq("id", user.id)
            .single()

          if (!adminError && adminUser) {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        }
      } catch (err) {
        console.error("Error getting user:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        
        // Check if user is admin
        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (!adminError && adminUser) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, mounted])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-balance">Patitas Conectadas</h1>
              <p className="text-sm text-muted-foreground">Encuentra a tu mascota perdida</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold">Patitas</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            {mounted && !isLoading && (
              <>
                {user ? (
                  <>
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href="/mis-publicaciones">
                        <User className="h-4 w-4 mr-2" />
                        Mis publicaciones
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button asChild variant="outline" className="bg-transparent border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Link href="/admin">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin
                        </Link>
                      </Button>
                    )}
                    <Button asChild>
                      <Link href="/publicar">
                        <Plus className="h-4 w-4 mr-2" />
                        Publicar
                      </Link>
                    </Button>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground max-w-32 truncate">{user.email}</span>
                      {isAdmin && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-transparent hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href="/auth/login">Iniciar sesión</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/sign-up">Registrarse</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            {mounted && !isLoading && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-transparent">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                          <PawPrint className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold">Patitas Conectadas</span>
                      </div>
                    </div>
                    
                    <nav className="flex flex-col gap-3 flex-1">
                      {user ? (
                        <>
                          <div className="pb-3 border-b">
                            <p className="text-sm text-muted-foreground mb-1">Usuario:</p>
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            {isAdmin && (
                              <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="justify-start">
                              <Link href="/publicar">
                                <Plus className="h-4 w-4 mr-2" />
                                Publicar
                              </Link>
                            </Button>
                          </SheetClose>
                          
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="justify-start">
                              <Link href="/mis-publicaciones">
                                <User className="h-4 w-4 mr-2" />
                                Mis publicaciones
                              </Link>
                            </Button>
                          </SheetClose>
                          
                          {isAdmin && (
                            <SheetClose asChild>
                              <Button asChild variant="outline" className="justify-start border-orange-200 text-orange-700 hover:bg-orange-50">
                                <Link href="/admin">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Admin
                                </Link>
                              </Button>
                            </SheetClose>
                          )}
                          
                          <div className="mt-auto pt-4 border-t">
                            <Button
                              onClick={handleLogout}
                              variant="outline"
                              className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Cerrar sesión
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="w-full">
                              <Link href="/auth/login">Iniciar sesión</Link>
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button asChild className="w-full">
                              <Link href="/auth/sign-up">Registrarse</Link>
                            </Button>
                          </SheetClose>
                        </div>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
