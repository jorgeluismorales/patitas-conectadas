"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Eye, Calendar, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Trash2, Ban, UserX, Settings } from "lucide-react"
import Link from "next/link"
import { AdminLayout } from "./admin-layout"
import { adminService } from "@/lib/admin-service"

interface Report {
  id: string
  reason: string
  description?: string
  status: string
  created_at: string
  publication_id: string
  reporter_id: string
  publications: {
    id: string
    title: string
    status: string
    user_id: string
  }
  profiles: {
    full_name: string
    id: string
  }
}

interface ReportsManagementProps {
  reports: Report[]
  adminRole: string
  user: any
}

export function ReportsManagement({ reports: initialReports, adminRole, user }: ReportsManagementProps) {
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isPublicationDialogOpen, setIsPublicationDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | "review">("resolve")
  const [publicationAction, setPublicationAction] = useState<"delete" | "inactive" | "resolved">("inactive")
  const [banReason, setBanReason] = useState("")
  const [actionNotes, setActionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [userStats, setUserStats] = useState<any>(null)
  const [publicationDetails, setPublicationDetails] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getReasonLabel = (reason: string) => {
    const labels = {
      contenido_inapropiado: "Contenido inapropiado",
      informacion_falsa: "Información falsa",
      spam: "Spam",
      otro: "Otro",
    }
    return labels[reason as keyof typeof labels] || reason
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "destructive" as const, icon: Clock },
      reviewed: { label: "Revisado", variant: "secondary" as const, icon: Eye },
      resolved: { label: "Resuelto", variant: "default" as const, icon: CheckCircle },
      dismissed: { label: "Descartado", variant: "outline" as const, icon: XCircle },
    }
    return (
      statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const, icon: Clock }
    )
  }

  const handleAction = async () => {
    if (!selectedReport) return

    setIsSubmitting(true)

    try {
      const result = await adminService.updateReportStatus(selectedReport.id, 
        actionType === "resolve" ? "resolved" : 
        actionType === "dismiss" ? "dismissed" : "reviewed"
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      const newStatus = actionType === "resolve" ? "resolved" : actionType === "dismiss" ? "dismissed" : "reviewed"
      setReports((prev) =>
        prev.map((report) => (report.id === selectedReport.id ? { ...report, status: newStatus } : report)),
      )

      toast({
        title: "Acción completada",
        description: `El reporte ha sido ${newStatus === "resolved" ? "resuelto" : newStatus === "dismissed" ? "descartado" : "marcado como revisado"}.`,
      })

      setIsActionDialogOpen(false)
      setSelectedReport(null)
      setActionNotes("")
    } catch (error) {
      console.error("Error updating report:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar el reporte. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublicationAction = async () => {
    if (!selectedReport) return

    setIsSubmitting(true)

    try {
      let result
      if (publicationAction === "delete") {
        result = await adminService.deletePublication(selectedReport.publications.id)
      } else {
        result = await adminService.updatePublicationStatus(
          selectedReport.publications.id, 
          publicationAction as "inactive" | "resolved"
        )
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      setReports((prev) =>
        prev.map((report) => 
          report.id === selectedReport.id 
            ? { 
                ...report, 
                publications: { 
                  ...report.publications, 
                  status: publicationAction === "delete" ? "deleted" : publicationAction 
                } 
              } 
            : report
        ),
      )

      toast({
        title: "Acción completada",
        description: `La publicación ha sido ${
          publicationAction === "delete" ? "eliminada" :
          publicationAction === "inactive" ? "marcada como inactiva" : "marcada como resuelta"
        }.`,
      })

      setIsPublicationDialogOpen(false)
      setSelectedReport(null)
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

  const handleBanUser = async () => {
    if (!selectedReport) return

    setIsSubmitting(true)

    try {
      const result = await adminService.banUser(selectedReport.publications.user_id, banReason)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Usuario baneado",
        description: "El usuario ha sido baneado exitosamente.",
      })

      setIsUserDialogOpen(false)
      setSelectedReport(null)
      setBanReason("")
    } catch (error) {
      console.error("Error banning user:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al banear al usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      const result = await adminService.getUserStats(userId)
      if (result.data) {
        setUserStats(result.data)
      }
    } catch (error) {
      console.error("Error loading user stats:", error)
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

  const filteredReports = reports.filter((report) => {
    if (filterStatus === "all") return true
    return report.status === filterStatus
  })

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  }

  return (
    <AdminLayout user={user} adminRole={adminRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Reportes</h1>
            <p className="text-muted-foreground">Revisa y modera los reportes de la comunidad</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
              <p className="text-xs text-muted-foreground">Revisados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Resueltos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
              <p className="text-xs text-muted-foreground">Descartados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los reportes</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="reviewed">Revisados</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="dismissed">Descartados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const statusConfig = getStatusBadge(report.status)
              const StatusIcon = statusConfig.icon

              return (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                          <span className="text-sm font-medium">{getReasonLabel(report.reason)}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Reportado por:</span>
                            <span>{report.profiles?.full_name || "Usuario"}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Fecha:</span>
                            <span>{formatDate(report.created_at)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Publicación:</span>
                            <Link
                              href={`/publicacion/${report.publications?.id}`}
                              className="text-primary hover:underline truncate"
                            >
                              {report.publications?.title || "Publicación eliminada"}
                            </Link>
                          </div>
                        </div>

                        {report.description && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Descripción adicional:</p>
                            <p className="text-sm">{report.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/publicacion/${report.publications?.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver publicación
                          </Link>
                        </Button>

                        {report.status === "pending" && (
                          <>
                            <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedReport(report)}
                                  className="bg-primary text-primary-foreground"
                                >
                                  Tomar acción
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Tomar acción sobre el reporte</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Acción a tomar</label>
                                    <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="resolve">Resolver (válido)</SelectItem>
                                        <SelectItem value="dismiss">Descartar (no válido)</SelectItem>
                                        <SelectItem value="review">Marcar como revisado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Notas (opcional)</label>
                                    <Textarea
                                      placeholder="Agrega notas sobre tu decisión..."
                                      value={actionNotes}
                                      onChange={(e) => setActionNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsActionDialogOpen(false)}
                                      className="flex-1"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button onClick={handleAction} disabled={isSubmitting} className="flex-1">
                                      {isSubmitting ? "Procesando..." : "Confirmar acción"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={isPublicationDialogOpen} onOpenChange={setIsPublicationDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    loadPublicationDetails(report.publications?.id)
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Gestionar publicación
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
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium">Acción sobre la publicación</label>
                                    <Select value={publicationAction} onValueChange={(value: any) => setPublicationAction(value)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="inactive">Marcar como inactiva</SelectItem>
                                        <SelectItem value="resolved">Marcar como resuelta</SelectItem>
                                        <SelectItem value="delete">Eliminar publicación</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsPublicationDialogOpen(false)}
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

                            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    loadUserStats(report.publications?.user_id)
                                  }}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Gestionar usuario
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Gestionar usuario</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {userStats && (
                                    <div className="p-3 bg-muted rounded-lg text-sm">
                                      <p><strong>Nombre:</strong> {userStats.full_name}</p>
                                      <p><strong>Email:</strong> {userStats.email}</p>
                                      <p><strong>Publicaciones:</strong> {userStats.publications_count}</p>
                                      <p><strong>Reportes recibidos:</strong> {userStats.reports_received_count}</p>
                                      <p><strong>Reportes hechos:</strong> {userStats.reports_made_count}</p>
                                      {userStats.banned && (
                                        <p className="text-red-600"><strong>Estado:</strong> Baneado</p>
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium">Razón del baneo</label>
                                    <Textarea
                                      placeholder="Describe la razón del baneo..."
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsUserDialogOpen(false)}
                                      className="flex-1"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button 
                                      onClick={handleBanUser} 
                                      disabled={isSubmitting || !banReason.trim()} 
                                      className="flex-1"
                                      variant="destructive"
                                    >
                                      {isSubmitting ? "Procesando..." : "Banear usuario"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
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
                <h3 className="text-lg font-semibold mb-2">No hay reportes</h3>
                <p className="text-muted-foreground">
                  {filterStatus === "all"
                    ? "No se han recibido reportes aún."
                    : `No hay reportes con estado "${filterStatus}".`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
