import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { UserProfile, UserRole } from '@/types';

/**
 * Get the current user's profile from the database
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient(cookies());
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      // Handle RLS infinite recursion error
      if (profileError.code === '42P17') {
        console.warn('RLS policy recursion detected in getCurrentUserProfile');
        
        // Try with service role if available
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const serviceSupabase = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                }
              }
            );
            
            const { data: serviceProfile, error: serviceError } = await serviceSupabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
              
            if (!serviceError && serviceProfile) {
              // Use service role data
              return {
                id: serviceProfile.id,
                userId: serviceProfile.user_id,
                role: serviceProfile.role as UserRole,
                isActive: serviceProfile.is_active,
                bannedAt: serviceProfile.banned_at,
                bannedBy: serviceProfile.banned_by,
                banReason: serviceProfile.ban_reason,
                createdAt: serviceProfile.created_at,
                updatedAt: serviceProfile.updated_at
              };
            }
          } catch (serviceError) {
            console.error('Service role fallback failed:', serviceError);
          }
        }
      }
      return null;
    }

    if (!profile) {
      return null;
    }
    
    return {
      id: profile.id,
      userId: profile.user_id,
      role: profile.role as UserRole,
      isActive: profile.is_active,
      bannedAt: profile.banned_at,
      bannedBy: profile.banned_by,
      banReason: profile.ban_reason,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === role && profile?.isActive === true;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN);
}

/**
 * Check if the current user is banned
 */
export async function isBanned(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.bannedAt !== null && profile?.bannedAt !== undefined;
}