"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  Calendar,
  Mail,
  Flag,
  User,
  Palette,
  Ruler,
  Tag,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react"

interface Publication {
  id: string
  title: string
  description: string
  publication_type: string
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
  contact_phone?: string
  contact_email?: string
  created_at: string
  user_full_name: string
  user_phone?: string
  user_id: string
  status: string
}

interface PublicationDetailsProps {
  publication: Publication
  currentUser?: any
}

export function PublicationDetails({ publication, currentUser }: PublicationDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

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

  const getSizeLabel = (size?: string) => {
    if (!size) return null
    const labels = {
      pequeño: "Pequeño",
      mediano: "Mediano",
      grande: "Grande",
    }
    return labels[size as keyof typeof labels] || size
  }

  const getLocationLabel = () => {
    return publication.publication_type === 'found' 
      ? "Lugar donde fue encontrada" 
      : "Lugar donde se perdió"
  }

  const getDateLabel = () => {
    return publication.publication_type === 'found' 
      ? "Fecha del hallazgo" 
      : "Fecha en que se perdió"
  }

  const getContactLabel = () => {
    return publication.publication_type === 'found' 
      ? "Encontrada por" 
      : "Reportada por"
  }

  const getLocation = () => {
    return publication.publication_type === 'found' 
      ? publication.location_found 
      : publication.location_lost
  }

  const getDate = () => {
    return publication.publication_type === 'found' 
      ? publication.found_date 
      : publication.lost_date
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % publication.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + publication.images.length) % publication.images.length)
  }

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/publicacion/${publication.id}`
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      toast({
        title: "Enlace copiado",
        description: "El enlace de la publicación se copió al portapapeles",
      })
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const updateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    try {
      // Get the current user to ensure we have permissions
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para actualizar el estado",
          variant: "destructive",
        })
        return
      }

      // Check if user is the owner
      if (user.id !== publication.user_id) {
        toast({
          title: "Sin permisos",
          description: "Solo el autor de la publicación puede cambiar su estado",
          variant: "destructive",
        })
        return
      }

      // Try using the RPC function first
      console.log(`Attempting to update publication ${publication.id} to status: ${newStatus}`)
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_publication_status', {
        publication_id: publication.id,
        new_status: newStatus
      })

      console.log('RPC Result:', rpcResult, 'RPC Error:', rpcError)

      if (rpcError) {
        console.log("RPC function not available, trying direct update:", rpcError)
        
        // Fallback to direct update
        const { error: updateError, data: updateData } = await supabase
          .from("publications")
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", publication.id)
          .eq("user_id", user.id)
          .select()

        console.log('Direct update result:', updateData, 'Direct update error:', updateError)

        if (updateError) {
          throw updateError
        }
        
        if (!updateData || updateData.length === 0) {
          throw new Error("No se pudo actualizar la publicación. Verifica que seas el propietario.")
        }
      } else if (rpcResult && !rpcResult.success) {
        throw new Error(rpcResult.error || "Error updating status")
      }

      let successMessage = ""
      if (newStatus === "resolved") {
        successMessage = publication.publication_type === 'found' 
          ? "¡Genial! La mascota fue reunida con su familia."
          : "¡Genial! La mascota fue encontrada."
      } else if (newStatus === "inactive") {
        successMessage = "Publicación marcada como inactiva. Ya no aparecerá en los resultados de búsqueda."
      } else if (newStatus === "active") {
        successMessage = "Publicación reactivada. Volverá a aparecer en los resultados de búsqueda."
      } else {
        successMessage = "Estado actualizado correctamente"
      }

      toast({
        title: "Estado actualizado",
        description: successMessage,
      })

      // Redirect to home instead of reloading or going to mis-publicaciones
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    } catch (error: any) {
      console.error("Error updating status:", error)
      
      let errorMessage = "No se pudo actualizar el estado. Inténtalo de nuevo."
      
      // Provide more specific error messages
      if (error?.code === "42501") {
        errorMessage = "Error de permisos. Verifica que seas el propietario de esta publicación."
      } else if (error?.code === "23514") {
        errorMessage = "Estado no válido. Solo se permiten: activo, inactivo, resuelto."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason) {
      toast({
        title: "Error",
        description: "Debes seleccionar una razón para el reporte",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReport(true)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para reportar una publicación",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("reports").insert({
        publication_id: publication.id,
        reporter_id: user.id,
        reason: reportReason,
        description: reportDescription || null,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Reporte enviado",
        description: "Gracias por tu reporte. Lo revisaremos pronto.",
      })

      setIsReportDialogOpen(false)
      setReportReason("")
      setReportDescription("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el reporte. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const isOwner = currentUser && currentUser.id === publication.user_id

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Detalles de la publicación</h1>
          
          {/* Action buttons grouped by 2 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* First row/group of buttons */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Button onClick={copyLink} variant="outline" size="sm" className="flex-1 sm:flex-none">
                {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {linkCopied ? "Copiado" : "Copiar enlace"}
              </Button>

              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reportar publicación</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="report-reason">Razón del reporte</Label>
                      <Select value={reportReason} onValueChange={setReportReason}>
                        <SelectTrigger id="report-reason">
                          <SelectValue placeholder="Selecciona una razón" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contenido_inapropiado">Contenido inapropiado</SelectItem>
                          <SelectItem value="informacion_falsa">Información falsa</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="report-description">Descripción adicional (opcional)</Label>
                      <Textarea
                        id="report-description"
                        placeholder="Proporciona más detalles sobre el problema..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsReportDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={handleReport} disabled={isSubmittingReport} className="flex-1">
                        {isSubmittingReport ? "Enviando..." : "Enviar reporte"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Second row/group - Owner buttons (if applicable) */}
            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {publication.status === "active" && (
                  <>
                    <Button
                      onClick={() => updateStatus("resolved")}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      size="sm"
                    >
                      {isUpdatingStatus ? "Actualizando..." : 
                        publication.publication_type === 'found' ? "Marcar como reunido" : "Marcar como encontrado"}
                    </Button>
                    <Button
                      onClick={() => updateStatus("inactive")}
                      disabled={isUpdatingStatus}
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 flex-1"
                      size="sm"
                    >
                      {isUpdatingStatus ? "Actualizando..." : "Marcar como inactiva"}
                    </Button>
                  </>
                )}

                {publication.status === "inactive" && (
                  <Button
                    onClick={() => updateStatus("active")}
                    disabled={isUpdatingStatus}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    size="sm"
                  >
                    {isUpdatingStatus ? "Actualizando..." : "Reactivar publicación"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {publication.status === "resolved" && (
          <div className="container mx-auto px-4 pt-6">
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  {publication.publication_type === 'found' 
                    ? "¡Esta mascota ya fue reunida con su familia! 🎉"
                    : "¡Esta mascota ya fue encontrada! 🎉"}
                </p>
              </div>
            </div>
          </div>
        )}

        {publication.status === "inactive" && (
          <div className="container mx-auto px-4 pt-6">
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-orange-600" />
                <p className="text-sm text-orange-800 font-medium">
                  Esta publicación está marcada como inactiva y ya no aparece en los resultados de búsqueda.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {publication.images && publication.images.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={publication.images[currentImageIndex] || "/placeholder.svg"}
                      alt={`${publication.title} - Imagen ${currentImageIndex + 1}`}
                      className="w-full h-64 md:h-96 object-cover rounded-t-lg"
                    />
                    {publication.is_urgent && (
                      <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                        Urgente
                      </Badge>
                    )}

                    {publication.images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Imagen anterior</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Siguiente imagen</span>
                        </Button>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {publication.images.map((_, index) => (
                            <button
                              key={index}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? "bg-white" : "bg-white/50"
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {publication.images.length > 1 && (
                    <div className="p-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {publication.images.map((image, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                              index === currentImageIndex ? "border-primary" : "border-transparent"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Miniatura ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Title and Description */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-balance">{publication.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{getPetTypeLabel(publication.pet_type)}</Badge>
                      {publication.is_urgent && (
                        <Badge className="bg-destructive text-destructive-foreground">Urgente</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-pretty">{publication.description}</p>
              </CardContent>
            </Card>

            {/* Pet Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Características de la mascota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publication.pet_size && (
                    <div className="flex items-center gap-3">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tamaño</p>
                        <p className="text-sm text-muted-foreground">{getSizeLabel(publication.pet_size)}</p>
                      </div>
                    </div>
                  )}

                  {publication.pet_color && (
                    <div className="flex items-center gap-3">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Color</p>
                        <p className="text-sm text-muted-foreground">{publication.pet_color}</p>
                      </div>
                    </div>
                  )}

                  {publication.pet_breed && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Raza</p>
                        <p className="text-sm text-muted-foreground">{publication.pet_breed}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location and Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación y fecha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getLocation() && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{getLocationLabel()}</p>
                      <p className="text-sm text-muted-foreground">{getLocation()}</p>
                    </div>
                  </div>
                )}

                {getDate() && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{getDateLabel()}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(getDate()!)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {publication.status === "active" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">{getContactLabel()}</p>
                    <p className="text-sm text-muted-foreground">{publication.user_full_name}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {publication.contact_phone && (
                      <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                        <a
                          href={`https://api.whatsapp.com/send/?phone=${publication.contact_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="h-4 w-4 mr-2 fill-white" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109" />
                          </svg>
                          Contactar por WhatsApp
                        </a>
                      </Button>
                    )}

                    {publication.contact_email && (
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <a href={`mailto:${publication.contact_email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar email
                        </a>
                      </Button>
                    )}

                    {!publication.contact_phone && !publication.contact_email && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay información de contacto disponible
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {publication.status === "resolved" && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {publication.publication_type === 'found' 
                      ? "Esta mascota ya fue reunida con su familia. Los datos de contacto ya no están disponibles."
                      : "Esta mascota ya fue encontrada. Los datos de contacto ya no están disponibles."}
                  </p>
                </CardContent>
              </Card>
            )}

            {publication.status === "inactive" && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Flag className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Esta publicación está inactiva. Los datos de contacto ya no están disponibles.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Publication Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la publicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Publicado el</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(publication.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
