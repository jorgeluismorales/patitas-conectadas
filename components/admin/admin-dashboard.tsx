"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "./admin-layout"
import { BarChart3, Users, FileText, AlertTriangle, Eye, Calendar } from "lucide-react"
import Link from "next/link"

interface AdminDashboardProps {
  user: any
  adminRole: string
  stats: {
    totalPublications: number
    activePublications: number
    totalReports: number
    pendingReports: number
    totalUsers: number
  }
  recentReports: any[]
  recentPublications: any[]
}

export function AdminDashboard({ user, adminRole, stats, recentReports, recentPublications }: AdminDashboardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "destructive" as const },
      reviewed: { label: "Revisado", variant: "secondary" as const },
      resolved: { label: "Resuelto", variant: "default" as const },
      dismissed: { label: "Descartado", variant: "outline" as const },
      active: { label: "Activa", variant: "default" as const },
      inactive: { label: "Inactiva", variant: "secondary" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const }
  }

  return (
    <AdminLayout user={user} adminRole={adminRole}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publicaciones Totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPublications}</div>
              <p className="text-xs text-muted-foreground">{stats.activePublications} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reportes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingReports} pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reportes Pendientes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingReports}</div>
              <p className="text-xs text-muted-foreground">requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gestión de Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Revisa y modera los reportes de la comunidad
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/reports">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Ver reportes
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestión de Publicaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Administra las publicaciones de mascotas
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/publications">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver publicaciones
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Administra los usuarios de la plataforma
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Ver usuarios
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reportes Recientes</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/reports">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {report.reason ? report.reason.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Sin razón especificada"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(report.status).variant}>
                          {getStatusBadge(report.status).label}
                        </Badge>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/reports`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay reportes recientes</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Publications */}
          <Card>
            <CardHeader>
              <CardTitle>Publicaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPublications.length > 0 ? (
                <div className="space-y-4">
                  {recentPublications.map((publication) => (
                    <div key={publication.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{publication.title || 'Sin título'}</p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(publication.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(publication.status).variant}>
                          {getStatusBadge(publication.status).label}
                        </Badge>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/publicacion/${publication.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay publicaciones recientes</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
