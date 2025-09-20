'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { UserRole, UserProfile } from '@/types'
import { requireAdmin, requirePermission } from '@/lib/permissions'
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
    
    const supabase = createClient(cookies())
    
    // Get users from auth.users and their profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user:user_id (
          email,
          user_metadata
        )
      `)
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('Error fetching users:', profilesError)
      return { success: false, error: 'Failed to fetch users' }
    }
    
    const users = profiles?.map(profile => ({
      id: profile.user_id,
      email: profile.user?.email || '',
      name: profile.user?.user_metadata?.name || profile.user?.user_metadata?.full_name || '',
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
    })) || []
    
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
export async function updateUserRole(data: UpdateUserRoleData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requireAdmin()
    
    const supabase = createClient(cookies())
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Prevent self-demotion
    if (currentUser.id === data.userId && data.role !== UserRole.ADMIN) {
      return { success: false, error: 'Cannot change your own role' }
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        role: data.role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: 'Failed to update user role' }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user role' 
    }
  }
}

/**
 * Ban a user (Admin only)
 */
export async function banUser(data: BanUserData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requirePermission(Permission.BAN_USERS)
    
    const supabase = createClient(cookies())
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Prevent self-ban
    if (currentUser.id === data.userId) {
      return { success: false, error: 'Cannot ban yourself' }
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: false,
        banned_at: new Date().toISOString(),
        banned_by: currentUser.id,
        ban_reason: data.reason,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error banning user:', error)
      return { success: false, error: 'Failed to ban user' }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in banUser:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to ban user' 
    }
  }
}

/**
 * Unban a user (Admin only)
 */
export async function unbanUser(data: UnbanUserData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requirePermission(Permission.BAN_USERS)
    
    const supabase = createClient(cookies())
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: true,
        banned_at: null,
        banned_by: null,
        ban_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', data.userId)
    
    if (error) {
      console.error('Error unbanning user:', error)
      return { success: false, error: 'Failed to unban user' }
    }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in unbanUser:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unban user' 
    }
  }
}

/**
 * Get user statistics (Admin only)
 */
export async function getUserStats(): Promise<{
  success: boolean
  data?: {
    totalUsers: number
    activeUsers: number
    bannedUsers: number
    adminUsers: number
  }
  error?: string
}> {
  try {
    await requireAdmin()
    
    const supabase = createClient(cookies())
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('role, is_active')
    
    if (error) {
      console.error('Error fetching user stats:', error)
      return { success: false, error: 'Failed to fetch user statistics' }
    }
    
    const stats = {
      totalUsers: profiles?.length || 0,
      activeUsers: profiles?.filter(p => p.is_active).length || 0,
      bannedUsers: profiles?.filter(p => !p.is_active).length || 0,
      adminUsers: profiles?.filter(p => p.role === UserRole.ADMIN).length || 0,
    }
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user statistics' 
    }
  }
}