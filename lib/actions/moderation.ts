'use server'

import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { requirePermission, getCurrentUserProfile } from '@/lib/permissions'
import { Permission } from '@/types'
import { revalidatePath } from 'next/cache'

export interface ModeratePollData {
  pollId: string
  action: 'approve' | 'hide' | 'delete'
  reason?: string
}

export interface ModerateCommentData {
  commentId: string
  action: 'approve' | 'hide' | 'delete'
  reason?: string
}

export interface Poll {
  id: string
  title: string
  description?: string
  created_at: string
  user_id: string
  is_active: boolean
  moderation_status: 'pending' | 'approved' | 'hidden'
  moderation_reason?: string
  moderated_at?: string
  moderated_by?: string
  user: {
    email: string
    user_metadata?: {
      name?: string
      full_name?: string
    }
  }
  options: Array<{
    id: string
    text: string
  }>
  _count: {
    votes: number
  }
}

export interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  poll_id: string
  parent_id?: string
  is_active: boolean
  moderation_status: 'pending' | 'approved' | 'hidden'
  moderation_reason?: string
  moderated_at?: string
  moderated_by?: string
  user: {
    email: string
    user_metadata?: {
      name?: string
      full_name?: string
    }
  }
  poll: {
    title: string
  }
}

/**
 * Get polls that need moderation (Admin/Moderator only)
 */
export async function getPollsForModeration(): Promise<Poll[]> {
  try {
    await requirePermission(Permission.MODERATE_POLLS)
    
    const supabase = await createClient()
    
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        created_at,
        user_id,
        is_active,
        is_approved,
        is_hidden,
        moderation_reason,
        moderated_at,
        moderated_by,
        options (
          id,
          text
        ),
        votes (count)
      `)
      .or('is_approved.eq.false,is_hidden.eq.true')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching polls for moderation:', error)
      return []
    }

    // Get user profiles for the polls
    const userIds = polls?.map(poll => poll.user_id).filter(Boolean) || []
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds)
    
    // Create a map for quick lookup
    const userMap = new Map(userProfiles?.map(profile => [profile.user_id, profile]) || [])
    
    // Transform the data to match our interface
    return polls?.map(poll => {
      const userProfile = userMap.get(poll.user_id)
      return {
        ...poll,
        moderation_status: poll.is_hidden ? 'hidden' : (poll.is_approved ? 'approved' : 'pending'),
        user: {
          email: userProfile?.email || 'Unknown',
          user_metadata: {
            name: userProfile?.full_name || 'Unknown User',
            full_name: userProfile?.full_name || 'Unknown User'
          }
        },
        _count: {
          votes: poll.votes?.length || 0
        }
      }
    }) || []
  } catch (error) {
    console.error('Error in getPollsForModeration:', error)
    return []
  }
}

/**
 * Moderate a poll (Admin/Moderator only)
 */
export async function moderatePoll(data: ModeratePollData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requirePermission(Permission.MODERATE_POLLS)
    
    const supabase = await createClient()
    const currentUser = await getCurrentUserProfile()
    
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' }
    }
    
    let updateData: any = {
      moderated_at: new Date().toISOString(),
      moderated_by: currentUser.userId,
      moderation_reason: data.reason || null
    }
    
    switch (data.action) {
      case 'approve':
        updateData.is_approved = true
        updateData.is_hidden = false
        updateData.is_active = true
        break
      case 'hide':
        updateData.is_approved = false
        updateData.is_hidden = true
        updateData.is_active = false
        break
      case 'delete':
        // For delete, we'll set is_active to false and mark as hidden
        updateData.is_approved = false
        updateData.is_hidden = true
        updateData.is_active = false
        break
    }
    
    const { error } = await supabase
      .from('polls')
      .update(updateData)
      .eq('id', data.pollId)
    
    if (error) {
      console.error('Error moderating poll:', error)
      return { success: false, error: 'Failed to moderate poll' }
    }
    
    revalidatePath('/admin/moderation')
    return { success: true }
  } catch (error) {
    console.error('Error in moderatePoll:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to moderate poll' 
    }
  }
}

/**
 * Get comments that need moderation (Admin/Moderator only)
 */
export async function getCommentsForModeration(): Promise<Comment[]> {
  try {
    await requirePermission(Permission.MODERATE_COMMENTS)
    
    const supabase = await createClient()
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        poll_id,
        parent_id,
        is_active,
        is_approved,
        is_hidden,
        moderation_reason,
        moderated_at,
        moderated_by
      `)
      .or('is_approved.eq.false,is_hidden.eq.true')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching comments for moderation:', error)
      return []
    }

    // Get user profiles for the comments
    const userIds = comments?.map(comment => comment.user_id).filter(Boolean) || []
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds)

    // Get poll titles for the comments
    const pollIds = comments?.map(comment => comment.poll_id).filter(Boolean) || []
    const { data: polls } = await supabase
      .from('polls')
      .select('id, title')
      .in('id', pollIds)
    
    // Create maps for quick lookup
    const userMap = new Map(userProfiles?.map(profile => [profile.user_id, profile]) || [])
    const pollMap = new Map(polls?.map(poll => [poll.id, poll]) || [])
    
    // Transform the data to match our interface
    return comments?.map(comment => {
      const userProfile = userMap.get(comment.user_id)
      const poll = pollMap.get(comment.poll_id)
      return {
        ...comment,
        moderation_status: comment.is_hidden ? 'hidden' : (comment.is_approved ? 'approved' : 'pending'),
        user: {
          email: userProfile?.email || 'Unknown',
          user_metadata: {
            name: userProfile?.full_name || 'Unknown User',
            full_name: userProfile?.full_name || 'Unknown User'
          }
        },
        poll: {
          title: poll?.title || 'Unknown Poll'
        }
      }
    }) || []
  } catch (error) {
    console.error('Error in getCommentsForModeration:', error)
    return []
  }
}

/**
 * Moderate a comment (Admin/Moderator only)
 */
export async function moderateComment(data: ModerateCommentData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requirePermission(Permission.MODERATE_COMMENTS)
    
    const supabase = await createClient()
    const currentUser = await getCurrentUserProfile()
    
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' }
    }
    
    let updateData: any = {
      moderated_at: new Date().toISOString(),
      moderated_by: currentUser.userId,
      moderation_reason: data.reason || null
    }
    
    switch (data.action) {
      case 'approve':
        updateData.is_approved = true
        updateData.is_hidden = false
        updateData.is_active = true
        break
      case 'hide':
        updateData.is_approved = false
        updateData.is_hidden = true
        updateData.is_active = false
        break
      case 'delete':
        // For delete, we'll set is_active to false and mark as hidden
        updateData.is_approved = false
        updateData.is_hidden = true
        updateData.is_active = false
        break
    }
    
    const { error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', data.commentId)
    
    if (error) {
      console.error('Error moderating comment:', error)
      return { success: false, error: 'Failed to moderate comment' }
    }
    
    revalidatePath('/admin/moderation')
    return { success: true }
  } catch (error) {
    console.error('Error in moderateComment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to moderate comment' 
    }
  }
}

/**
 * Get moderation statistics (Admin/Moderator only)
 */
export async function getModerationStats(): Promise<{
  pendingPolls: number
  pendingComments: number
  totalModeratedPolls: number
  totalModeratedComments: number
} | null> {
  try {
    await requirePermission(Permission.MODERATE_POLLS)
    
    const supabase = await createClient()
    
    const [
      { count: pendingPolls },
      { count: pendingComments },
      { count: totalModeratedPolls },
      { count: totalModeratedComments }
    ] = await Promise.all([
      supabase.from('polls').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('polls').select('*', { count: 'exact', head: true }).not('moderated_at', 'is', null),
      supabase.from('comments').select('*', { count: 'exact', head: true }).not('moderated_at', 'is', null)
    ])
    
    return {
      pendingPolls: pendingPolls || 0,
      pendingComments: pendingComments || 0,
      totalModeratedPolls: totalModeratedPolls || 0,
      totalModeratedComments: totalModeratedComments || 0
    }
  } catch (error) {
    console.error('Error fetching moderation stats:', error)
    return null
  }
}