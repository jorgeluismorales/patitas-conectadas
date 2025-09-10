import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar } from "lucide-react"
import Link from "next/link"

interface PetCardProps {
  publication: {
    id: string
    publication_type: string
    title: string
    description: string
    pet_type: string
    pet_size?: string
    pet_color?: string
    location_found?: string
    location_lost?: string
    found_date?: string
    lost_date?: string
    images: string[]
    is_urgent: boolean
    user_full_name: string
    contact_phone?: string
    contact_email?: string
    status?: string
  }
}

export function PetCard({ publication }: PetCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
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
        borderColor: 'border-green-200'
      }
    } else {
      return {
        label: 'Se busca',
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      }
    }
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

  const typeInfo = getPublicationTypeInfo(publication.publication_type)
  const isResolved = publication.status === 'resolved'
  const isInactive = publication.status === 'inactive'

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow border shadow-sm ${typeInfo.borderColor} ${
      isResolved || isInactive ? 'opacity-60 bg-gray-50' : ''
    }`}>
      <div className="relative">
        {publication.images && publication.images.length > 0 ? (
          <img
            src={publication.images[0] || "/placeholder.svg"}
            alt={publication.title}
            className={`w-full h-32 object-cover ${isResolved || isInactive ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-32 bg-muted flex items-center justify-center ${isResolved || isInactive ? 'bg-gray-200' : ''}`}>
            <span className="text-muted-foreground text-xs">Sin imagen</span>
          </div>
        )}
        <div className="absolute top-1 left-1">
          <Badge className={`text-xs ${typeInfo.bgColor} ${typeInfo.textColor} border-0`}>
            {typeInfo.label}
          </Badge>
        </div>
        <div className="absolute top-1 right-1 flex gap-1 flex-wrap">
          {publication.is_urgent && !isResolved && !isInactive && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">Urgente</Badge>
          )}
          {isResolved && (
            <Badge className="bg-green-600 text-white text-xs">✓ Resuelto</Badge>
          )}
          {isInactive && (
            <Badge className="bg-gray-500 text-white text-xs">Inactiva</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm text-balance leading-tight line-clamp-2">{publication.title}</h3>
          <Badge variant="secondary" className="ml-1 shrink-0 text-xs">
            {getPetTypeLabel(publication.pet_type)}
          </Badge>
        </div>

        <p className="text-muted-foreground text-xs mb-2 line-clamp-2 text-pretty">{publication.description}</p>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">
              {publication.publication_type === 'found' ? publication.location_found : publication.location_lost}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {publication.publication_type === 'found' 
                ? `Encontrado el ${formatDate(publication.found_date!)}`
                : `Perdido el ${formatDate(publication.lost_date!)}`}
            </span>
          </div>

          <div className="flex gap-1 flex-wrap">
            {publication.pet_size && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {getSizeLabel(publication.pet_size)}
              </Badge>
            )}
            {publication.pet_color && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {publication.pet_color}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button asChild className="flex-1 text-xs h-8">
            <Link href={`/publicacion/${publication.id}`}>Ver detalles</Link>
          </Button>

          {/* Only show WhatsApp contact for active publications */}
          {publication.contact_phone && !isResolved && !isInactive && (
            <Button size="sm" variant="outline" asChild className="h-8 w-8 p-0 bg-transparent">
              <a
                href={`https://api.whatsapp.com/send/?phone=${publication.contact_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109" />
                </svg>
                <span className="sr-only">WhatsApp</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
