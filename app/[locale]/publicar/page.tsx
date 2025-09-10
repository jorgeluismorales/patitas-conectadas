"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, MapPin, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface FormData {
  publicationType: string
  title: string
  description: string
  petType: string
  petSize: string
  petColor: string
  petBreed: string
  locationFound: string
  locationLost: string
  foundDate: string
  lostDate: string
  contactPhone: string
  contactEmail: string
  isUrgent: boolean
  images: File[]
}

interface FormErrors {
  title?: string
  description?: string
  petType?: string
  locationFound?: string
  locationLost?: string
  foundDate?: string
  lostDate?: string
  contactPhone?: string
  contactEmail?: string
  images?: string
  contact?: string
}

export default function PublicarPage() {
  const [formData, setFormData] = useState<FormData>({
    publicationType: "found",
    title: "",
    description: "",
    petType: "",
    petSize: "",
    petColor: "",
    petBreed: "",
    locationFound: "",
    locationLost: "",
    foundDate: "",
    lostDate: "",
    contactPhone: "",
    contactEmail: "",
    isUrgent: false,
    images: [],
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear contact error if either phone or email is filled
    if ((field === 'contactPhone' || field === 'contactEmail') && formErrors.contact) {
      setFormErrors((prev) => ({ ...prev, contact: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = "El título es obligatorio"
    }

    if (!formData.description.trim()) {
      errors.description = "La descripción es obligatoria"
    }

    if (!formData.petType) {
      errors.petType = "El tipo de mascota es obligatorio"
    }

    // Date and location validation based on publication type
    if (formData.publicationType === 'found') {
      if (!formData.locationFound.trim()) {
        errors.locationFound = "La ubicación donde encontraste la mascota es obligatoria"
      }
      if (!formData.foundDate) {
        errors.foundDate = "La fecha del hallazgo es obligatoria"
      }
    } else {
      if (!formData.locationLost.trim()) {
        errors.locationLost = "La ubicación donde se perdió la mascota es obligatoria"
      }
      if (!formData.lostDate) {
        errors.lostDate = "La fecha de pérdida es obligatoria"
      }
    }

    // Image validation - at least one image required
    if (formData.images.length === 0) {
      errors.images = "Debes subir al menos una foto de la mascota"
    }

    // Contact validation - at least one contact method required
    const hasPhone = formData.contactPhone.trim().length > 0
    const hasEmail = formData.contactEmail.trim().length > 0
    
    if (!hasPhone && !hasEmail) {
      errors.contact = "Debes proporcionar al menos un método de contacto (teléfono de WhatsApp o email)"
    } else {
      // Validate phone format if provided
      if (hasPhone) {
        const phoneRegex = /^(\+\d{1,3}[\s-]?)?\d{10,14}$/
        if (!phoneRegex.test(formData.contactPhone.trim())) {
          errors.contactPhone = "Formato de teléfono inválido. Debe tener 10-14 dígitos, puede incluir código de país"
        }
      }
      
      // Validate email format if provided
      if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
        errors.contactEmail = "Formato de email inválido"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 5) {
      toast({
        title: "Límite de imágenes",
        description: "Puedes subir máximo 5 imágenes",
        variant: "destructive",
      })
      return
    }

    const newImages = [...formData.images, ...files]
    setFormData((prev) => ({ ...prev, images: newImages }))

    // Clear image error if any
    if (formErrors.images && newImages.length > 0) {
      setFormErrors((prev) => ({ ...prev, images: undefined }))
    }

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)

    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index])

    setFormData((prev) => ({ ...prev, images: newImages }))
    setImagePreviewUrls(newPreviewUrls)

    // Add error if no images left
    if (newImages.length === 0) {
      setFormErrors((prev) => ({ ...prev, images: "Debes subir al menos una foto de la mascota" }))
    }
  }

  const uploadImages = async (publicationId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (let i = 0; i < formData.images.length; i++) {
      const file = formData.images[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${publicationId}_${i}.${fileExt}`
      const filePath = `publications/${fileName}`

      const { error: uploadError } = await supabase.storage.from("pet-images").upload(filePath, file)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        continue
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("pet-images").getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    if (!validateForm()) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para publicar",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      // Create publication
      const publicationData = {
        user_id: user.id,
        publication_type: formData.publicationType,
        title: formData.title,
        description: formData.description,
        pet_type: formData.petType,
        pet_size: formData.petSize || null,
        pet_color: formData.petColor || null,
        pet_breed: formData.petBreed || null,
        location_found: formData.publicationType === 'found' ? formData.locationFound : null,
        location_lost: formData.publicationType === 'lost' ? formData.locationLost : null,
        found_date: formData.publicationType === 'found' ? formData.foundDate : null,
        lost_date: formData.publicationType === 'lost' ? formData.lostDate : null,
        contact_phone: formData.contactPhone || null,
        contact_email: formData.contactEmail || null,
        is_urgent: formData.isUrgent,
        images: [], // Will be updated after image upload
      }

      const { data: publication, error: publicationError } = await supabase
        .from("publications")
        .insert(publicationData)
        .select()
        .single()

      if (publicationError) {
        throw publicationError
      }

      // Upload images if any
      let imageUrls: string[] = []
      if (formData.images.length > 0) {
        imageUrls = await uploadImages(publication.id)

        // Update publication with image URLs
        const { error: updateError } = await supabase
          .from("publications")
          .update({ images: imageUrls })
          .eq("id", publication.id)

        if (updateError) {
          console.error("Error updating images:", updateError)
        }
      }

      toast({
        title: "¡Publicación creada!",
        description: formData.publicationType === 'found' 
          ? "Tu hallazgo ha sido publicado exitosamente"
          : "Tu búsqueda ha sido publicada exitosamente",
      })

      router.push(`/publicacion/${publication.id}`)
    } catch (error) {
      console.error("Error creating publication:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al crear la publicación. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.title && 
           formData.description && 
           formData.petType && 
           formData.images.length > 0 &&
           (formData.contactPhone.trim() || formData.contactEmail.trim()) &&
           ((formData.publicationType === 'found' && formData.locationFound && formData.foundDate) ||
            (formData.publicationType === 'lost' && formData.locationLost && formData.lostDate))
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publication-type">Tipo de publicación *</Label>
                <Select value={formData.publicationType} onValueChange={(value) => handleInputChange("publicationType", value)}>
                  <SelectTrigger id="publication-type">
                    <SelectValue placeholder="Selecciona el tipo de publicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="found">Encontré una mascota</SelectItem>
                    <SelectItem value="lost">Perdí mi mascota</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.publicationType === 'found' 
                    ? 'Selecciona esta opción si encontraste una mascota perdida'
                    : 'Selecciona esta opción si perdiste tu mascota'}
                </p>
              </div>

              <div>
                <Label htmlFor="title">Título de la publicación *</Label>
                <Input
                  id="title"
                  placeholder={formData.publicationType === 'found' 
                    ? "Ej: Perro encontrado en el parque central"
                    : "Ej: Se perdió mi gato en el barrio La Floresta"}
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={formErrors.title ? "border-red-500" : ""}
                  required
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción detallada *</Label>
                <Textarea
                  id="description"
                  placeholder={formData.publicationType === 'found'
                    ? "Describe las características de la mascota, dónde la encontraste, su comportamiento, etc."
                    : "Describe las características de tu mascota, dónde se perdió, cuándo la viste por última vez, etc."}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className={formErrors.description ? "border-red-500" : ""}
                  required
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => handleInputChange("isUrgent", checked as boolean)}
                />
                <Label
                  htmlFor="urgent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {formData.publicationType === 'found'
                    ? "Marcar como urgente (la mascota necesita atención médica inmediata)"
                    : "Marcar como urgente (mi mascota necesita medicación o cuidados especiales)"}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Pet Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la mascota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet-type">Tipo de mascota *</Label>
                  <Select value={formData.petType} onValueChange={(value) => handleInputChange("petType", value)}>
                    <SelectTrigger id="pet-type" className={formErrors.petType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.petType && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.petType}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pet-size">Tamaño</Label>
                  <Select value={formData.petSize} onValueChange={(value) => handleInputChange("petSize", value)}>
                    <SelectTrigger id="pet-size">
                      <SelectValue placeholder="Selecciona el tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeño">Pequeño</SelectItem>
                      <SelectItem value="mediano">Mediano</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet-color">Color</Label>
                  <Input
                    id="pet-color"
                    placeholder="Ej: Marrón y blanco"
                    value={formData.petColor}
                    onChange={(e) => handleInputChange("petColor", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="pet-breed">Raza (si la conoces)</Label>
                  <Input
                    id="pet-breed"
                    placeholder="Ej: Labrador, Mestizo"
                    value={formData.petBreed}
                    onChange={(e) => handleInputChange("petBreed", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location and Date */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación y fecha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.publicationType === 'found' ? (
                <>
                  <div>
                    <Label htmlFor="location">Lugar donde encontraste la mascota *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="Ej: Parque Central, Barrio La Floresta, Calle 123"
                        value={formData.locationFound}
                        onChange={(e) => handleInputChange("locationFound", e.target.value)}
                        className={`pl-10 ${formErrors.locationFound ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {formErrors.locationFound && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.locationFound}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="found-date">Fecha en que encontraste la mascota *</Label>
                    <Input
                      id="found-date"
                      type="date"
                      value={formData.foundDate}
                      onChange={(e) => handleInputChange("foundDate", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className={formErrors.foundDate ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.foundDate && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.foundDate}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="location-lost">Lugar donde se perdió tu mascota *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location-lost"
                        placeholder="Ej: Parque Central, Barrio La Floresta, Calle 123"
                        value={formData.locationLost}
                        onChange={(e) => handleInputChange("locationLost", e.target.value)}
                        className={`pl-10 ${formErrors.locationLost ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {formErrors.locationLost && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.locationLost}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lost-date">Fecha en que se perdió tu mascota *</Label>
                    <Input
                      id="lost-date"
                      type="date"
                      value={formData.lostDate}
                      onChange={(e) => handleInputChange("lostDate", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className={formErrors.lostDate ? "border-red-500" : ""}
                      required
                    />
                    {formErrors.lostDate && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.lostDate}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>
                {formData.publicationType === 'found' ? 'Fotos de la mascota encontrada' : 'Fotos de tu mascota perdida'} *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Subir fotos (máximo 5) - Al menos una foto es obligatoria</Label>
                <div className="mt-2">
                  <label
                    htmlFor="images"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      formErrors.images 
                        ? "border-red-500 bg-red-50" 
                        : "border-muted-foreground/25"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra las imágenes aquí
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG hasta 10MB cada una</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={formData.images.length >= 5}
                    />
                  </label>
                </div>
                {formErrors.images && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.images}
                  </p>
                )}
              </div>

              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Eliminar imagen</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formErrors.contact && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formErrors.contact}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-phone">Teléfono de WhatsApp</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="Ej: +57 300 123 4567"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className={formErrors.contactPhone ? "border-red-500" : ""}
                  />
                  {formErrors.contactPhone && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.contactPhone}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className={formErrors.contactEmail ? "border-red-500" : ""}
                  />
                  {formErrors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.contactEmail}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Debes proporcionar al menos un método de contacto (teléfono de WhatsApp o email) para que los dueños puedan comunicarse contigo.
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid() || isSubmitting}>
              {isSubmitting 
                ? "Publicando..." 
                : formData.publicationType === 'found' 
                  ? "Publicar hallazgo" 
                  : "Publicar búsqueda"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
