'use server'

import { createClient } from '@/lib/supabase/server'
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

/**
 * Get all polls for moderation (Admin/Moderator only)
 */
export async function getPollsForModeration(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    title: string
    description?: string
    createdBy: string
    createdAt: string
    isApproved: boolean
    isHidden: boolean
    moderatedBy?: string
    moderatedAt?: string
    moderationReason?: string
    creator?: {
      email: string
      name?: string
    }
  }>
  error?: string
}> {
  try {
    await requirePermission(Permission.MODERATE_POLLS)
    
    const supabase = createClient(cookies())
    
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        created_by,
        created_at,
        is_approved,
        is_hidden,
        moderated_by,
        moderated_at,
        moderation_reason
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching polls for moderation:', error)
      return { success: false, error: 'Failed to fetch polls' }
    }
    
    // Get creator information for each poll
    const pollsWithCreators = await Promise.all(
      (polls || []).map(async (poll) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select(`
            user_id,
            user:user_id (
              email,
              user_metadata
            )
          `)
          .eq('user_id', poll.created_by)
          .single()
        
        return {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          createdBy: poll.created_by,
          createdAt: poll.created_at,
          isApproved: poll.is_approved,
          isHidden: poll.is_hidden,
          moderatedBy: poll.moderated_by,
          moderatedAt: poll.moderated_at,
          moderationReason: poll.moderation_reason,
          creator: profile?.user ? {
            email: profile.user.email || '',
            name: profile.user.user_metadata?.name || profile.user.user_metadata?.full_name || ''
          } : undefined
        }
      })
    )
    
    return { success: true, data: pollsWithCreators }
  } catch (error) {
    console.error('Error in getPollsForModeration:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch polls for moderation' 
    }
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
    
    const supabase = createClient(cookies())
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }
    
    let updateData: any = {
      moderated_by: profile.userId,
      moderated_at: new Date().toISOString(),
      moderation_reason: data.reason || null
    }
    
    switch (data.action) {
      case 'approve':
        updateData.is_approved = true
        updateData.is_hidden = false
        break
      case 'hide':
        updateData.is_approved = false
        updateData.is_hidden = true
        break
      case 'delete':
        // For delete, we'll actually delete the poll
        const { error: deleteError } = await supabase
          .from('polls')
          .delete()
          .eq('id', data.pollId)
        
        if (deleteError) {
          console.error('Error deleting poll:', deleteError)
          return { success: false, error: 'Failed to delete poll' }
        }
        
        revalidatePath('/admin/moderation')
        revalidatePath('/polls')
        return { success: true }
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
    revalidatePath('/polls')
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
 * Get all comments for moderation (Admin/Moderator only)
 */
export async function getCommentsForModeration(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    content: string
    pollId: string
    userId: string
    createdAt: string
    isApproved: boolean
    isHidden: boolean
    moderatedBy?: string
    moderatedAt?: string
    moderationReason?: string
    user?: {
      email: string
      name?: string
    }
    poll?: {
      title: string
    }
  }>
  error?: string
}> {
  try {
    await requirePermission(Permission.MODERATE_COMMENTS)
    
    const supabase = createClient(cookies())
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        poll_id,
        user_id,
        created_at,
        is_approved,
        is_hidden,
        moderated_by,
        moderated_at,
        moderation_reason
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching comments for moderation:', error)
      return { success: false, error: 'Failed to fetch comments' }
    }
    
    // Get user and poll information for each comment
    const commentsWithDetails = await Promise.all(
      (comments || []).map(async (comment) => {
        // Get user info
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select(`
            user:user_id (
              email,
              user_metadata
            )
          `)
          .eq('user_id', comment.user_id)
          .single()
        
        // Get poll info
        const { data: poll } = await supabase
          .from('polls')
          .select('title')
          .eq('id', comment.poll_id)
          .single()
        
        return {
          id: comment.id,
          content: comment.content,
          pollId: comment.poll_id,
          userId: comment.user_id,
          createdAt: comment.created_at,
          isApproved: comment.is_approved,
          isHidden: comment.is_hidden,
          moderatedBy: comment.moderated_by,
          moderatedAt: comment.moderated_at,
          moderationReason: comment.moderation_reason,
          user: userProfile?.user ? {
            email: userProfile.user.email || '',
            name: userProfile.user.user_metadata?.name || userProfile.user.user_metadata?.full_name || ''
          } : undefined,
          poll: poll ? { title: poll.title } : undefined
        }
      })
    )
    
    return { success: true, data: commentsWithDetails }
  } catch (error) {
    console.error('Error in getCommentsForModeration:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch comments for moderation' 
    }
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
    
    const supabase = createClient(cookies())
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }
    
    let updateData: any = {
      moderated_by: profile.userId,
      moderated_at: new Date().toISOString(),
      moderation_reason: data.reason || null
    }
    
    switch (data.action) {
      case 'approve':
        updateData.is_approved = true
        updateData.is_hidden = false
        break
      case 'hide':
        updateData.is_approved = false
        updateData.is_hidden = true
        break
      case 'delete':
        // For delete, we'll actually delete the comment
        const { error: deleteError } = await supabase
          .from('comments')
          .delete()
          .eq('id', data.commentId)
        
        if (deleteError) {
          console.error('Error deleting comment:', deleteError)
          return { success: false, error: 'Failed to delete comment' }
        }
        
        revalidatePath('/admin/moderation')
        return { success: true }
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
  success: boolean
  data?: {
    polls: {
      total: number
      approved: number
      hidden: number
      pending: number
    }
    comments: {
      total: number
      approved: number
      hidden: number
      pending: number
    }
  }
  error?: string
}> {
  try {
    await requirePermission(Permission.MODERATE_POLLS)
    
    const supabase = createClient(cookies())
    
    // Get poll stats
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('is_approved, is_hidden')
    
    // Get comment stats
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('is_approved, is_hidden')
    
    if (pollsError || commentsError) {
      console.error('Error fetching moderation stats:', pollsError || commentsError)
      return { success: false, error: 'Failed to fetch moderation statistics' }
    }
    
    const pollStats = {
      total: polls?.length || 0,
      approved: polls?.filter(p => p.is_approved && !p.is_hidden).length || 0,
      hidden: polls?.filter(p => p.is_hidden).length || 0,
      pending: polls?.filter(p => !p.is_approved && !p.is_hidden).length || 0,
    }
    
    const commentStats = {
      total: comments?.length || 0,
      approved: comments?.filter(c => c.is_approved && !c.is_hidden).length || 0,
      hidden: comments?.filter(c => c.is_hidden).length || 0,
      pending: comments?.filter(c => !c.is_approved && !c.is_hidden).length || 0,
    }
    
    return { 
      success: true, 
      data: {
        polls: pollStats,
        comments: commentStats
      }
    }
  } catch (error) {
    console.error('Error in getModerationStats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch moderation statistics' 
    }
  }
}