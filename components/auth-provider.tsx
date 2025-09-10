"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  mounted: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  mounted: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  const checkUserBanStatus = async (user: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('banned, ban_reason')
        .eq('id', user.id)
        .single()

      if (profile?.banned) {
        // If user is banned, sign them out
        await supabase.auth.signOut()
        setUser(null)
        // Redirect to banned page with reason
        const url = new URL('/auth/banned', window.location.origin)
        if (profile.ban_reason) {
          url.searchParams.set('reason', profile.ban_reason)
        }
        window.location.href = url.toString()
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking ban status:', error)
      return true // Allow user to continue if check fails
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!error && user) {
          const isAllowed = await checkUserBanStatus(user)
          if (isAllowed) {
            setUser(user)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Error getting user:", err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isAllowed = await checkUserBanStatus(session.user)
        if (isAllowed) {
          setUser(session.user)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, mounted])

  return (
    <AuthContext.Provider value={{ user, isLoading, mounted }}>
      {children}
    </AuthContext.Provider>
  )
}