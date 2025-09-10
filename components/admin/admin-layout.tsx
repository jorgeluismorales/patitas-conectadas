"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { BarChart3, AlertTriangle, Users, FileText } from "lucide-react"
import Link from "next/link"

interface AdminLayoutProps {
  children: React.ReactNode
  user: any
  adminRole: string
}

export function AdminLayout({ children, user, adminRole }: AdminLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Admin Navigation */}
      <div className="mb-6 border-b bg-card rounded-lg p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/reports">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reportes
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/publications">
              <FileText className="h-4 w-4 mr-2" />
              Publicaciones
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin/reports">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportes
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin/publications">
                <FileText className="h-4 w-4 mr-2" />
                Publicaciones
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </Link>
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      {children}
    </div>
  )
}
