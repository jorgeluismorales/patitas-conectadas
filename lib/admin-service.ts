import { createClient } from "@/lib/supabase/client"

export interface UserStats {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  banned: boolean
  banned_at: string | null
  ban_reason: string | null
  publications_count: number
  reports_received_count: number
  reports_made_count: number
  created_at: string
}

export interface PublicationDetails {
  id: string
  user_id: string
  title: string
  description: string
  pet_type: string
  status: string
  created_at: string
  user_full_name: string
  user_email: string
  user_phone: string | null
  user_banned: boolean
  report_count: number
}

export class AdminService {
  private supabase = createClient()

  // User management functions
  async banUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('ban_user', {
        target_user_id: userId,
        ban_reason: reason,
        should_ban: true
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error banning user:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('ban_user', {
        target_user_id: userId,
        should_ban: false
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error unbanning user:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async getUserStats(userId: string): Promise<{ data: UserStats | null; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('admin_get_user_stats', {
        target_user_id: userId
      })

      if (error) throw error

      return { data: data?.[0] || null }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // Publication management functions
  async updatePublicationStatus(
    publicationId: string, 
    status: 'active' | 'resolved' | 'inactive'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('admin_update_publication_status', {
        publication_id: publicationId,
        new_status: status
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating publication status:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async deletePublication(publicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('admin_delete_publication', {
        publication_id: publicationId
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting publication:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async getPublicationDetails(publicationId: string): Promise<{ data: PublicationDetails | null; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('admin_get_publication_details', {
        publication_id: publicationId
      })

      if (error) throw error

      return { data: data?.[0] || null }
    } catch (error) {
      console.error('Error getting publication details:', error)
      return { data: null, error: (error as Error).message }
    }
  }

  // Report management functions
  async updateReportStatus(
    reportId: string, 
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating report status:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Get all users for admin management
  async getAllUsers(
    page: number = 0, 
    limit: number = 20,
    filter?: { banned?: boolean; search?: string }
  ): Promise<{ data: any[]; count: number; error?: string }> {
    try {
      // First get all admin user IDs
      const { data: adminUsers } = await this.supabase
        .from('admin_users')
        .select('id')

      const adminUserIds = adminUsers?.map(admin => admin.id) || []

      let query = this.supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          banned,
          banned_at,
          ban_reason,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      // Exclude admin users if any exist
      if (adminUserIds.length > 0) {
        query = query.not('id', 'in', `(${adminUserIds.join(',')})`)
      }

      if (filter?.banned !== undefined) {
        query = query.eq('banned', filter.banned)
      }

      if (filter?.search) {
        query = query.or(`full_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error getting users:', error)
      return { data: [], count: 0, error: (error as Error).message }
    }
  }

  // Get all publications for admin management
  async getAllPublications(
    page: number = 0,
    limit: number = 20,
    filter?: { status?: string; search?: string }
  ): Promise<{ data: any[]; count: number; error?: string }> {
    try {
      let query = this.supabase
        .from('publications')
        .select(`
          id,
          title,
          description,
          pet_type,
          status,
          created_at,
          user_id,
          profiles!fk_publications_user_id (
            full_name,
            email,
            banned
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error getting publications:', error)
      return { data: [], count: 0, error: (error as Error).message }
    }
  }
}

export const adminService = new AdminService()