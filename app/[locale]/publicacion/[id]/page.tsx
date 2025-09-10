import { createClient } from "@/lib/supabase/server"
import { PublicationDetails } from "@/components/publication-details"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  console.log("[v0] Fetching publication with ID:", id)

  const { data: publication, error } = await supabase
    .from("publications")
    .select("*")
    .eq("id", id)
    .single()

  console.log("[v0] Publication query result:", { publication, error })

  if (error) {
    console.error("[v0] Publication query error:", error)
    notFound()
  }

  if (!publication) {
    console.log("[v0] No publication found with ID:", id)
    notFound()
  }

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Check if publication is inactive and user is not the owner
  if (publication.status === 'inactive' && (!currentUser || currentUser.id !== publication.user_id)) {
    notFound()
  }

  let userProfile = null
  if (publication.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", publication.user_id)
      .single()

    userProfile = profile
  }

  const formattedPublication = {
    ...publication,
    user_full_name: userProfile?.full_name || "Usuario",
    user_phone: userProfile?.phone,
  }

  return <PublicationDetails publication={formattedPublication} currentUser={currentUser} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: publication } = await supabase.from("publications").select("title, description").eq("id", id).single()

  if (!publication) {
    return {
      title: "Publicación no encontrada - Patitas Conectadas",
    }
  }

  return {
    title: `${publication.title} - Patitas Conectadas`,
    description: publication.description.slice(0, 160),
  }
}
