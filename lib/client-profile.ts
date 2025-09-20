'use client'

import { createClient } from '@/lib/supabase'
import { UserProfile, UserRole } from '@/types'

/**
 * Client-side function to fetch user profile with fallback to server action
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  
  try {
    // First try direct client query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (data && !error) {
      return {
        id: data.id,
        userId: data.user_id,
        role: data.role as UserRole,
        isActive: data.is_active,
        bannedAt: data.banned_at,
        bannedBy: data.banned_by,
        banReason: data.ban_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }
    
    // If client query fails, try server action fallback
    if (error) {
      console.warn('Client profile fetch failed, trying server fallback:', error)
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const profileData = await response.json()
          return profileData.profile
        }
      } catch (serverError) {
        console.error('Server profile fetch also failed:', serverError)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}