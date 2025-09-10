import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PublicationManagement } from "@/components/admin/publication-management"

export default async function AdminPublicationsPage() {
  const supabase = await createClient()

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminError || !adminUser) {
    redirect("/")
  }

  return <PublicationManagement adminRole={adminUser.role} user={user} />
}