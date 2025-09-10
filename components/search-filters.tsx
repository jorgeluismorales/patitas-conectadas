"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    search: string
    petType: string
    location: string
    size: string
    publicationType: string
  }) => void
  isLoading?: boolean
}

export function SearchFilters({ onFiltersChange, isLoading }: SearchFiltersProps) {
  const [search, setSearch] = useState("")
  const [petType, setPetType] = useState("all")
  const [location, setLocation] = useState("")
  const [size, setSize] = useState("all")
  const [publicationType, setPublicationType] = useState("all")
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)

  const handleSearch = () => {
    onFiltersChange({ search, petType, location, size, publicationType })
  }

  const clearFilters = () => {
    setSearch("")
    setPetType("all")
    setLocation("")
    setSize("all")
    setPublicationType("all")
    onFiltersChange({ search: "", petType: "all", location: "", size: "all", publicationType: "all" })
  }

  const hasActiveFilters = search || petType !== "all" || location || size !== "all" || publicationType !== "all"

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Search bar - centered and larger */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">
                  Buscar mascotas
                </Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, descripción..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 text-base"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isLoading} size="lg" className="h-12 px-8">
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-center w-full sm:text-left sm:w-auto">Filtros de búsqueda</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="hidden sm:flex">
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Mobile clear button */}
              {hasActiveFilters && (
                <div className="sm:hidden text-center">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publication-type" className="text-sm font-medium">Tipo de publicación</Label>
                  <Select value={publicationType} onValueChange={setPublicationType}>
                    <SelectTrigger id="publication-type" className="h-11">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="found">Mascotas encontradas</SelectItem>
                      <SelectItem value="lost">Mascotas perdidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pet-type" className="text-sm font-medium">Tipo de mascota</Label>
                  <Select value={petType} onValueChange={setPetType}>
                    <SelectTrigger id="pet-type" className="h-11">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm font-medium">Tamaño</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger id="size" className="h-11">
                      <SelectValue placeholder="Todos los tamaños" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tamaños</SelectItem>
                      <SelectItem value="pequeño">Pequeño</SelectItem>
                      <SelectItem value="mediano">Mediano</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Ciudad, barrio..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
