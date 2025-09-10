"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { PetCard } from "@/components/pet-card"
import { SearchFilters } from "@/components/search-filters" 
import { Button } from "@/components/ui/button"
import { Heart, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Publication {
  id: string
  publication_type: string
  title: string
  description: string
  pet_type: string
  pet_size?: string
  pet_color?: string
  pet_breed?: string
  location_found?: string
  location_lost?: string
  found_date?: string
  lost_date?: string
  images: string[]
  is_urgent: boolean
  user_full_name: string
  contact_phone?: string
  contact_email?: string
  user_id: string
  status: string
}

export default function HomePage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: "",
    petType: "",
    location: "",
    size: "",
    publicationType: "",
  })

  const { user, mounted } = useAuth()
  const supabase = createClient()

  const loadPublications = async (reset = false) => {
    try {
      setError(null)

      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const offset = reset ? 0 : publications.length

      let query = supabase
        .from("publications")
        .select(`
          id,
          publication_type,
          title,
          description,
          pet_type,
          pet_size,
          pet_color,
          pet_breed,
          location_found,
          location_lost,
          found_date,
          lost_date,
          images,
          is_urgent,
          contact_phone,
          contact_email,
          user_id,
          status
        `)
        .in("status", ["active", "resolved"])
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + 11)

      if (filters.petType && filters.petType !== "all") {
        query = query.eq("pet_type", filters.petType)
      }
      if (filters.size && filters.size !== "all") {
        query = query.eq("pet_size", filters.size)
      }
      if (filters.publicationType && filters.publicationType !== "all") {
        query = query.eq("publication_type", filters.publicationType)
      }
      if (filters.location) {
        query = query.or(`location_found.ilike.%${filters.location}%,location_lost.ilike.%${filters.location}%`)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data: publicationsData, error: pubError } = await query

      if (pubError) {
        console.error("Database error:", pubError)
        setError("Error al cargar las publicaciones. Por favor, intenta de nuevo.")
        setPublications([])
        return
      }

      const userIds = publicationsData?.map((pub) => pub.user_id).filter(Boolean) || []
      let profilesData: any[] = []

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)

        if (!profileError) {
          profilesData = profiles || []
        }
      }

      const formattedData =
        publicationsData?.map((pub) => {
          const userProfile = profilesData.find((profile) => profile.id === pub.user_id)
          return {
            ...pub,
            user_full_name: userProfile?.full_name || "Usuario",
          }
        }) || []

      if (reset) {
        setPublications(formattedData)
      } else {
        setPublications((prev) => [...prev, ...formattedData])
      }

      setHasMore(formattedData.length === 12)
    } catch (error) {
      console.error("Unexpected error:", error)
      setError("Error inesperado. Por favor, recarga la página.")
      setPublications([])
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      loadPublications(true)
    }
  }, [filters, mounted])

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadPublications(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                🤝 Comunidad colaborativa
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Esta plataforma funciona gracias a la ayuda de todos. Para tu seguridad, 
                <span className="font-medium text-blue-700"> siempre coordina encuentros en lugares públicos</span> y 
                <span className="font-medium text-green-700"> lleva acompañante si es posible</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <SearchFilters onFiltersChange={handleFiltersChange} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={() => loadPublications(true)} variant="outline" className="mt-2">
                Reintentar
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-32 mb-3"></div>
                  <div className="space-y-2">
                    <div className="bg-muted rounded h-3 w-3/4"></div>
                    <div className="bg-muted rounded h-3 w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publications.length > 0 ? (
            <>
              <div className="flex items-center justify-center sm:justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-center">
                  {publications.length} publicación{publications.length !== 1 ? "es" : ""}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {publications.map((publication) => (
                  <PetCard key={publication.id} publication={publication} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-4">
                  <Button onClick={loadMore} disabled={isLoadingMore} variant="outline" size="lg">
                    {isLoadingMore ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">No se encontraron publicaciones</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 text-pretty max-w-md mx-auto">
                No hay publicaciones que coincidan con tu búsqueda. Intenta ajustar los filtros o{" "}
                <Link href="/publicar" className="text-primary hover:underline font-medium">
                  publica aquí
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
