"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, Calendar, User, Settings, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { AdminLayout } from "./admin-layout"
import { adminService } from "@/lib/admin-service"
import { createClient } from "@/lib/supabase/client"

interface PublicationManagementProps {
  adminRole: string
  user: any
}

export function PublicationManagement({ adminRole, user }: PublicationManagementProps) {
  const [publications, setPublications] = useState<any[]>([])
  const [selectedPublication, setSelectedPublication] = useState<any>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [publicationAction, setPublicationAction] = useState<"delete" | "inactive" | "resolved" | "active">("inactive")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [publicationDetails, setPublicationDetails] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const pageSize = 20

  useEffect(() => {
    loadPublications()
  }, [currentPage, filterStatus, searchTerm])

  const loadPublications = async () => {
    setIsLoading(true)
    try {
      const filter: any = {}
      
      if (filterStatus !== "all") filter.status = filterStatus
      if (searchTerm) filter.search = searchTerm

      const result = await adminService.getAllPublications(currentPage, pageSize, filter)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setPublications(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error("Error loading publications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPublicationDetails = async (publicationId: string) => {
    try {
      const result = await adminService.getPublicationDetails(publicationId)
      if (result.data) {
        setPublicationDetails(result.data)
      }
    } catch (error) {
      console.error("Error loading publication details:", error)
    }
  }

  const handlePublicationAction = async () => {
    if (!selectedPublication) return

    setIsSubmitting(true)

    try {
      let result
      if (publicationAction === "delete") {
        result = await adminService.deletePublication(selectedPublication.id)
      } else {
        result = await adminService.updatePublicationStatus(
          selectedPublication.id, 
          publicationAction as "inactive" | "resolved" | "active"
        )
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      if (publicationAction === "delete") {
        setPublications((prev) => prev.filter((pub) => pub.id !== selectedPublication.id))
      } else {
        setPublications((prev) =>
          prev.map((pub) => 
            pub.id === selectedPublication.id 
              ? { ...pub, status: publicationAction } 
              : pub
          ),
        )
      }

      toast({
        title: "Acción completada",
        description: `La publicación ha sido ${
          publicationAction === "delete" ? "eliminada" :
          publicationAction === "inactive" ? "marcada como inactiva" : 
          publicationAction === "resolved" ? "marcada como resuelta" : "marcada como activa"
        }.`,
      })

      setIsActionDialogOpen(false)
      setSelectedPublication(null)
    } catch (error) {
      console.error("Error updating publication:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar la publicación. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activa", variant: "default" as const },
      resolved: { label: "Resuelta", variant: "secondary" as const },
      inactive: { label: "Inactiva", variant: "outline" as const },
    }
    return (
      statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const }
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <AdminLayout user={user} adminRole={adminRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Publicaciones</h1>
            <p className="text-muted-foreground">Administra las publicaciones de la plataforma</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {publications.filter(p => p.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {publications.filter(p => p.status === "resolved").length}
              </div>
              <p className="text-xs text-muted-foreground">Resueltas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {publications.filter(p => p.status === "inactive").length}
              </div>
              <p className="text-xs text-muted-foreground">Inactivas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las publicaciones</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="resolved">Resueltas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            Total: {totalCount} publicaciones
          </div>
        </div>

        {/* Publications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Cargando publicaciones...</p>
            </div>
          ) : publications.length > 0 ? (
            publications.map((publication) => {
              const statusConfig = getStatusBadge(publication.status)

              return (
                <Card key={publication.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                          <h3 className="font-semibold">{publication.title}</h3>
                          {publication.profiles?.banned && (
                            <Badge variant="destructive">Autor baneado</Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {publication.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Autor:</span>
                            <span>{publication.profiles?.full_name || "Usuario"}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Creada:</span>
                            <span>{formatDate(publication.created_at)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="capitalize">{publication.pet_type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/publicacion/${publication.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver publicación
                          </Link>
                        </Button>

                        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPublication(publication)
                                loadPublicationDetails(publication.id)
                              }}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Gestionar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gestionar publicación</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {publicationDetails && (
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p><strong>Título:</strong> {publicationDetails.title}</p>
                                  <p><strong>Autor:</strong> {publicationDetails.user_full_name}</p>
                                  <p><strong>Estado actual:</strong> {publicationDetails.status}</p>
                                  <p><strong>Reportes:</strong> {publicationDetails.report_count}</p>
                                  {publicationDetails.user_banned && (
                                    <p className="text-red-600"><strong>Usuario baneado:</strong> Sí</p>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium">Acción sobre la publicación</label>
                                <Select value={publicationAction} onValueChange={(value: any) => setPublicationAction(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Marcar como activa</SelectItem>
                                    <SelectItem value="inactive">Marcar como inactiva</SelectItem>
                                    <SelectItem value="resolved">Marcar como resuelta</SelectItem>
                                    <SelectItem value="delete">Eliminar publicación</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsActionDialogOpen(false)}
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  onClick={handlePublicationAction} 
                                  disabled={isSubmitting} 
                                  className="flex-1"
                                  variant={publicationAction === "delete" ? "destructive" : "default"}
                                >
                                  {isSubmitting ? "Procesando..." : "Confirmar"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay publicaciones</h3>
                <p className="text-muted-foreground">
                  No se encontraron publicaciones que coincidan con los filtros.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}