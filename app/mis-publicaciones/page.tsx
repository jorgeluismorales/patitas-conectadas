"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Publication {
  id: string
  title: string
  description: string
  publication_type: string
  pet_type: string
  pet_size?: string
  pet_color?: string
  location_found?: string
  location_lost?: string
  found_date?: string
  lost_date?: string
  images: string[]
  is_urgent: boolean
  status: string
  created_at: string
  contact_phone?: string
  contact_email?: string
}

export default function MisPublicacionesPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const { user, mounted } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (mounted && user) {
      loadMyPublications()
    } else if (mounted && !user) {
      router.push("/auth/login")
    }
  }, [mounted, user])

  const loadMyPublications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPublications(data || [])
    } catch (error) {
      console.error("Error loading publications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (publicationId: string, newStatus: string) => {
    try {
      // Try using the RPC function first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_publication_status', {
        publication_id: publicationId,
        new_status: newStatus
      })

      if (rpcError) {
        console.log("RPC function not available, trying direct update:", rpcError)
        
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from("publications")
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", publicationId)
          .eq("user_id", user?.id)

        if (updateError) {
          throw updateError
        }
      } else if (rpcResult && !rpcResult.success) {
        throw new Error(rpcResult.error || "Error updating status")
      }

      toast({
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado",
      })

      loadMyPublications()
    } catch (error: any) {
      console.error("Error updating status:", error)
      
      let errorMessage = "No se pudo actualizar el estado"
      if (error?.code === "42501") {
        errorMessage = "Error de permisos. Verifica que seas el propietario de esta publicación."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPetTypeLabel = (type: string) => {
    const labels = {
      perro: "Perro",
      gato: "Gato",
      otro: "Otro",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getPublicationTypeInfo = (type: string) => {
    if (type === 'found') {
      return {
        label: 'Encontrado',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      }
    } else {
      return {
        label: 'Se busca',
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-800',
      }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Activa',
          icon: AlertCircle,
          color: 'text-green-600'
        }
      case 'resolved':
        return {
          label: 'Resuelta',
          icon: CheckCircle,
          color: 'text-blue-600'
        }
      case 'inactive':
        return {
          label: 'Inactiva',
          icon: XCircle,
          color: 'text-orange-600'
        }
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: 'text-gray-600'
        }
    }
  }

  const filteredPublications = publications.filter(pub => {
    switch (activeTab) {
      case "active":
        return pub.status === "active"
      case "resolved":
        return pub.status === "resolved"
      case "inactive":
        return pub.status === "inactive"
      default:
        return true
    }
  })

  if (!mounted) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis Publicaciones</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">
            Todas ({publications.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Activas ({publications.filter(p => p.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resueltas ({publications.filter(p => p.status === "resolved").length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactivas ({publications.filter(p => p.status === "inactive").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="bg-muted rounded-t-lg h-48"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="bg-muted rounded h-4 w-3/4"></div>
                    <div className="bg-muted rounded h-3 w-1/2"></div>
                    <div className="bg-muted rounded h-3 w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPublications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublications.map((publication) => {
                const typeInfo = getPublicationTypeInfo(publication.publication_type)
                const statusInfo = getStatusInfo(publication.status)
                const StatusIcon = statusInfo.icon

                return (
                  <Card key={publication.id} className="overflow-hidden">
                    <div className="relative">
                      {publication.images && publication.images.length > 0 ? (
                        <img
                          src={publication.images[0] || "/placeholder.svg"}
                          alt={publication.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">Sin imagen</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2">
                        <Badge className={`text-xs ${typeInfo.bgColor} ${typeInfo.textColor} border-0`}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-2 right-2 flex gap-2">
                        {publication.is_urgent && (
                          <Badge className="bg-destructive text-destructive-foreground text-xs">
                            Urgente
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{publication.title}</h3>
                        <div className="flex items-center gap-1 ml-2">
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          <span className={`text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                        {publication.description}
                      </p>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">
                            {publication.publication_type === 'found' 
                              ? publication.location_found 
                              : publication.location_lost}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Publicado el {formatDate(publication.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getPetTypeLabel(publication.pet_type)}
                        </Badge>
                        
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/publicacion/${publication.id}`}>
                            Ver más
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No tienes publicaciones {activeTab === "all" ? "" : activeTab === "active" ? "activas" : activeTab === "resolved" ? "resueltas" : "inactivas"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "all" 
                  ? "Crea tu primera publicación para ayudar a encontrar mascotas perdidas."
                  : `No tienes publicaciones ${activeTab === "active" ? "activas" : activeTab === "resolved" ? "resueltas" : "inactivas"} en este momento.`}
              </p>
              {activeTab === "all" && (
                <Button asChild>
                  <Link href="/publicar">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear publicación
                  </Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}