"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Ban, UserCheck, Eye, Calendar, Mail, Phone, FileText, AlertTriangle } from "lucide-react"
import { AdminLayout } from "./admin-layout"
import { adminService } from "@/lib/admin-service"
import { createClient } from "@/lib/supabase/client"

interface UserManagementProps {
  adminRole: string
  user: any
}

export function UserManagement({ adminRole, user }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBanned, setFilterBanned] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const pageSize = 20

  useEffect(() => {
    loadUsers()
  }, [currentPage, filterBanned, searchTerm])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const filter: any = {}
      
      if (filterBanned === "banned") filter.banned = true
      if (filterBanned === "active") filter.banned = false
      if (searchTerm) filter.search = searchTerm

      const result = await adminService.getAllUsers(currentPage, pageSize, filter)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setUsers(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  const handleBanUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const result = await adminService.banUser(selectedUser.id, banReason)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) => 
          user.id === selectedUser.id 
            ? { ...user, banned: true, ban_reason: banReason } 
            : user
        ),
      )

      toast({
        title: "Usuario baneado",
        description: "El usuario ha sido baneado exitosamente.",
      })

      setIsBanDialogOpen(false)
      setSelectedUser(null)
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

  const handleUnbanUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const result = await adminService.unbanUser(selectedUser.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) => 
          user.id === selectedUser.id 
            ? { ...user, banned: false, ban_reason: null, banned_at: null } 
            : user
        ),
      )

      toast({
        title: "Usuario desbaneado",
        description: "El usuario ha sido desbaneado exitosamente.",
      })

      setIsUnbanDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al desbanear al usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios de la plataforma</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterBanned} onValueChange={setFilterBanned}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              <SelectItem value="active">Usuarios activos</SelectItem>
              <SelectItem value="banned">Usuarios baneados</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            Total: {totalCount} usuarios
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Cargando usuarios...</p>
            </div>
          ) : users.length > 0 ? (
            users.map((userItem) => (
              <Card key={userItem.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{userItem.full_name}</h3>
                        {userItem.banned ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            Baneado
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Activo
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span>
                          <span>{userItem.email}</span>
                        </div>

                        {userItem.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Teléfono:</span>
                            <span>{userItem.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Registrado:</span>
                          <span>{formatDate(userItem.created_at)}</span>
                        </div>

                        {userItem.banned_at && (
                          <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Baneado:</span>
                            <span>{formatDate(userItem.banned_at)}</span>
                          </div>
                        )}
                      </div>

                      {userItem.ban_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Razón del baneo:</strong> {userItem.ban_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(userItem)
                              loadUserStats(userItem.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles del usuario</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {userStats && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Nombre:</span>
                                    <p>{userStats.full_name}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span>
                                    <p>{userStats.email}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Teléfono:</span>
                                    <p>{userStats.phone || "No proporcionado"}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Estado:</span>
                                    <p>{userStats.banned ? "Baneado" : "Activo"}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {userStats.publications_count}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Publicaciones</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                      {userStats.reports_received_count}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Reportes recibidos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                      {userStats.reports_made_count}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Reportes hechos</p>
                                  </div>
                                </div>

                                {userStats.banned && userStats.ban_reason && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">
                                      <strong>Razón del baneo:</strong> {userStats.ban_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {!userItem.banned ? (
                        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Banear
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Banear usuario</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                ¿Estás seguro de que quieres banear a {selectedUser?.full_name}?
                              </p>

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
                                  onClick={() => {
                                    setIsBanDialogOpen(false)
                                    setBanReason("")
                                  }}
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
                                  {isSubmitting ? "Baneando..." : "Banear usuario"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => setSelectedUser(userItem)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Desbanear
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Desbanear usuario</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                ¿Estás seguro de que quieres desbanear a {selectedUser?.full_name}?
                              </p>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsUnbanDialogOpen(false)}
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  onClick={handleUnbanUser} 
                                  disabled={isSubmitting} 
                                  className="flex-1"
                                >
                                  {isSubmitting ? "Desbaneando..." : "Desbanear usuario"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
                <p className="text-muted-foreground">
                  No se encontraron usuarios que coincidan con los filtros.
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