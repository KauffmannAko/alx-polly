'use server'

import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { UserRole, UserProfile } from '@/types'
import { requireAdmin, requirePermission, isCurrentUserAdmin } from '@/lib/permissions'
import { Permission } from '@/types'
import { revalidatePath } from 'next/cache'

export interface UpdateUserRoleData {
  userId: string
  role: UserRole
}

export interface BanUserData {
  userId: string
  reason: string
}

export interface UnbanUserData {
  userId: string
}

/**
 * Get all users with their profiles (Admin only)
 */
export async function getAllUsers(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    email: string
    name?: string
    profile: UserProfile
  }>
  error?: string
}> {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    // Get user profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('Error fetching users:', profilesError)
      return { success: false, error: 'Failed to fetch users' }
    }

    // Get auth users data separately using service role
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return { success: false, error: 'Failed to fetch auth users' }
    }

    // Create a map of auth users for quick lookup
    const authUserMap = new Map(authUsers.users.map(user => [user.id, user]))
    
    const users = profiles?.map(profile => {
      const authUser = authUserMap.get(profile.user_id)
      return {
        id: profile.user_id,
        email: authUser?.email || 'Unknown',
        name: authUser?.user_metadata?.name || authUser?.user_metadata?.full_name || '',
        profile: {
          id: profile.id,
          userId: profile.user_id,
          role: profile.role as UserRole,
          isActive: profile.is_active,
          bannedAt: profile.banned_at,
          bannedBy: profile.banned_by,
          banReason: profile.ban_reason,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        }
      }
    }) || []
    
    return { success: true, data: users }
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch users' 
    }
  }
}

/**
 * Update user role (Admin only)
 */
export async function updateUserRole(data: UpdateUserRoleData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    // Update user role in user_profiles table
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: data.role })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}

export async function banUser(data: BanUserData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    // Update user status to banned
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: false,
        ban_reason: data.reason,
        banned_at: new Date().toISOString()
      })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error banning user:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in banUser:', error)
    return { success: false, error: 'Failed to ban user' }
  }
}

export async function unbanUser(data: UnbanUserData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    // Update user status to active
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: true,
        ban_reason: null,
        banned_at: null
      })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error unbanning user:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in unbanUser:', error)
    return { success: false, error: 'Failed to unban user' }
  }
}

export async function getUserStats(): Promise<{
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  adminUsers: number
  totalPolls: number
  totalComments: number
  totalVotes: number
} | null> {
  try {
    // Check if user is authenticated and is admin
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Insufficient permissions')
    }
    
    // Fetch user statistics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: bannedUsers },
      { count: adminUsers },
      { count: totalPolls },
      { count: totalComments },
      { count: totalVotes }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('polls').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true })
    ])
    
    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      bannedUsers: bannedUsers || 0,
      adminUsers: adminUsers || 0,
      totalPolls: totalPolls || 0,
      totalComments: totalComments || 0,
      totalVotes: totalVotes || 0
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return null
  }
}