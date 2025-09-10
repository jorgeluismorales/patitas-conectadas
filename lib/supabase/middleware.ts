import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware processing:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] User status:", user ? "authenticated" : "not authenticated")
    if (error) {
      console.log("[v0] Auth error:", error.message)
    }

    const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
    const isHomePage = request.nextUrl.pathname === "/"
    const isAdminPage = request.nextUrl.pathname.startsWith("/admin")
    const isBannedPage = request.nextUrl.pathname === "/auth/banned"

    // For authenticated users, check if they are banned (but not if they're already on the banned page)
    if (user && !isAuthPage && !isBannedPage) {
      console.log("[v0] Checking ban status for user:", user.id)
      try {
        const { data: profile, error: banCheckError } = await supabase
          .from('profiles')
          .select('banned, ban_reason')
          .eq('id', user.id)
          .single()

        console.log("[v0] Ban check result:", { profile, banCheckError })

        if (banCheckError) {
          console.log("[v0] Error checking ban status:", banCheckError)
        } else if (profile?.banned) {
          console.log("[v0] Banned user detected, signing out and redirecting")
          // Clear the session for banned users
          await supabase.auth.signOut()
          const url = request.nextUrl.clone()
          url.pathname = "/auth/banned"
          if (profile.ban_reason) {
            url.searchParams.set('reason', profile.ban_reason)
          }
          return NextResponse.redirect(url)
        } else {
          console.log("[v0] User is not banned")
        }
      } catch (banCheckError) {
        console.log("[v0] Exception checking ban status:", banCheckError)
        // Continue without blocking if ban check fails
      }
    }

    // Allow access to auth pages and home page without authentication
    if (isAuthPage || isHomePage) {
      console.log("[v0] Allowing access to:", request.nextUrl.pathname)
      return supabaseResponse
    }

    // Redirect to login only for protected pages (admin, publicar, etc.)
    if (!user && (isAdminPage || request.nextUrl.pathname.startsWith("/publicar"))) {
      console.log("[v0] Redirecting to login from:", request.nextUrl.pathname)
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.log("[v0] Middleware error:", error)
    // On error, allow access to prevent loops
    return supabaseResponse
  }

  return supabaseResponse
}
