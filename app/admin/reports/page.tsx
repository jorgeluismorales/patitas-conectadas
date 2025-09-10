import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportsManagement } from "@/components/admin/reports-management"

export default async function AdminReportsPage() {
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

  // Get all reports first
  const { data: reportsData, error: reportsError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })

  if (reportsError) {
    console.error("Error fetching reports:", reportsError)
    console.error("Error details:", JSON.stringify(reportsError, null, 2))
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error loading reports</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-medium">Error details:</p>
          <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap">
            {JSON.stringify(reportsError, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  // Get publications separately to avoid FK conflicts
  let reports = reportsData
  if (reportsData && reportsData.length > 0) {
    const publicationIds = [...new Set(reportsData.map(r => r.publication_id))]
    const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))]

    // Get publications
    const { data: publications } = await supabase
      .from("publications")
      .select("id, title, status, user_id")
      .in("id", publicationIds)

    // Get reporter profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reporterIds)

    const publicationsMap = new Map(publications?.map(p => [p.id, p]) || [])
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
    
    reports = reportsData.map(report => ({
      ...report,
      publications: publicationsMap.get(report.publication_id) || { 
        id: report.publication_id, 
        title: "Publicación no encontrada", 
        status: "deleted", 
        user_id: null 
      },
      profiles: profilesMap.get(report.reporter_id) || { 
        full_name: "Usuario desconocido", 
        id: report.reporter_id 
      }
    }))
  }

  return <ReportsManagement reports={reports || []} adminRole={adminUser.role} user={user} />
}
