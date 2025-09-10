import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
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

  // Get dashboard statistics
  const [publicationsResult, reportsResult, usersResult] = await Promise.all([
    supabase.from("publications").select("id, title, status, created_at").order("created_at", { ascending: false }),
    supabase.from("reports").select("id, status, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }),
  ])

  const stats = {
    totalPublications: publicationsResult.data?.length || 0,
    activePublications: publicationsResult.data?.filter((p) => p.status === "active").length || 0,
    totalReports: reportsResult.data?.length || 0,
    pendingReports: reportsResult.data?.filter((r) => r.status === "pending").length || 0,
    totalUsers: usersResult.data?.length || 0,
  }

  const recentReports = reportsResult.data?.slice(0, 5) || []
  const recentPublications = publicationsResult.data?.slice(0, 5) || []

  return (
    <AdminDashboard
      user={user}
      adminRole={adminUser.role}
      stats={stats}
      recentReports={recentReports}
      recentPublications={recentPublications}
    />
  )
}
