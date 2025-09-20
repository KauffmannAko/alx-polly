import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Try regular client first
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profile && !profileError) {
      return NextResponse.json({
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
      })
    }
    
    // If regular client fails, try service role
    if (profileError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Regular profile fetch failed, using service role:', profileError)
      
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
        )
        
        const { data: serviceProfile, error: serviceError } = await serviceSupabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (serviceProfile && !serviceError) {
          return NextResponse.json({
            profile: {
              id: serviceProfile.id,
              userId: serviceProfile.user_id,
              role: serviceProfile.role as UserRole,
              isActive: serviceProfile.is_active,
              bannedAt: serviceProfile.banned_at,
              bannedBy: serviceProfile.banned_by,
              banReason: serviceProfile.ban_reason,
              createdAt: serviceProfile.created_at,
              updatedAt: serviceProfile.updated_at,
            }
          })
        }
        
        console.error('Service role profile fetch failed:', serviceError)
      } catch (serviceError) {
        console.error('Service role client creation failed:', serviceError)
      }
    }
    
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  } catch (error) {
    console.error('Error in profile API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}