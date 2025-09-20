'use server'

import { createClient } from '@/lib/supabase-server'
import { getCurrentUserProfile } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

export interface CreateCommentData {
  pollId: string
  content: string
  parentId?: string // For threaded comments
  guestName?: string // For non-logged-in users
  guestEmail?: string // For non-logged-in users
}

export interface UpdateCommentData {
  commentId: string
  content: string
}

/**
 * Create a new comment on a poll
 */
export async function createComment(data: CreateCommentData): Promise<{
  success: boolean
  data?: { id: string }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await getCurrentUserProfile()
    
    // Allow both logged-in users and guests
    const isGuest = !profile
    
    if (isGuest) {
      // Validate guest information
      if (!data.guestName?.trim()) {
        return { success: false, error: 'Name is required for guest comments' }
      }
      if (!data.guestEmail?.trim()) {
        return { success: false, error: 'Email is required for guest comments' }
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.guestEmail)) {
        return { success: false, error: 'Please enter a valid email address' }
      }
    } else {
      // For logged-in users, check if account is active
      if (!profile.isActive) {
        return { success: false, error: 'Your account is not active' }
      }
    }

    // Validate content
    if (!data.content.trim()) {
      return { success: false, error: 'Comment content cannot be empty' }
    }

    if (data.content.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)' }
    }

    // Check if poll exists and is accessible
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_approved, is_hidden')
      .eq('id', data.pollId)
      .single()

    if (pollError || !poll) {
      return { success: false, error: 'Poll not found' }
    }

    if (!poll.is_approved || poll.is_hidden) {
      return { success: false, error: 'Cannot comment on this poll' }
    }

    // If this is a reply, validate parent comment exists
    if (data.parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, poll_id, depth')
        .eq('id', data.parentId)
        .single()

      if (parentError || !parentComment) {
        return { success: false, error: 'Parent comment not found' }
      }

      if (parentComment.poll_id !== data.pollId) {
        return { success: false, error: 'Parent comment is not on this poll' }
      }

      // Limit nesting depth
      if (parentComment.depth >= 5) {
        return { success: false, error: 'Maximum comment nesting depth reached' }
      }
    }

    // Create the comment
    const commentData = {
      poll_id: data.pollId,
      content: data.content.trim(),
      parent_id: data.parentId || null,
      is_approved: true, // Auto-approve for now
      is_hidden: false,
      // For guests, use provided name/email; for logged-in users, use profile data
      user_id: isGuest ? null : profile.userId,
      user_email: isGuest ? data.guestEmail : profile.email,
      user_name: isGuest ? data.guestName : profile.name
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return { success: false, error: 'Failed to create comment' }
    }

    revalidatePath(`/polls/${data.pollId}`)
    return { success: true, data: { id: comment.id } }
  } catch (error) {
    console.error('Error in createComment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create comment' 
    }
  }
}

/**
 * Update a comment (user can only update their own comments)
 */
export async function updateComment(data: UpdateCommentData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return { success: false, error: 'You must be logged in to edit comments' }
    }

    // Validate content
    if (!data.content.trim()) {
      return { success: false, error: 'Comment content cannot be empty' }
    }

    if (data.content.length > 2000) {
      return { success: false, error: 'Comment is too long (max 2000 characters)' }
    }

    // Check if comment exists and user owns it
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, poll_id')
      .eq('id', data.commentId)
      .single()

    if (commentError || !comment) {
      return { success: false, error: 'Comment not found' }
    }

    if (comment.user_id !== profile.userId) {
      return { success: false, error: 'You can only edit your own comments' }
    }

    // Update the comment
    const { error } = await supabase
      .from('comments')
      .update({
        content: data.content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.commentId)

    if (error) {
      console.error('Error updating comment:', error)
      return { success: false, error: 'Failed to update comment' }
    }

    revalidatePath(`/polls/${comment.poll_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateComment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update comment' 
    }
  }
}

/**
 * Delete a comment (user can only delete their own comments)
 */
export async function deleteComment(commentId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return { success: false, error: 'You must be logged in to delete comments' }
    }

    // Check if comment exists and user owns it
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, poll_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return { success: false, error: 'Comment not found' }
    }

    if (comment.user_id !== profile.userId) {
      return { success: false, error: 'You can only delete your own comments' }
    }

    // Delete the comment (this will cascade to child comments due to foreign key)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return { success: false, error: 'Failed to delete comment' }
    }

    revalidatePath(`/polls/${comment.poll_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteComment:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete comment' 
    }
  }
}

/**
 * Get threaded comments for a poll
 */
export async function getThreadedComments(pollId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    pollId: string
    userId: string
    parentId?: string
    content: string
    depth: number
    isApproved: boolean
    isHidden: boolean
    moderatedBy?: string
    moderatedAt?: string
    moderationReason?: string
    createdAt: string
    updatedAt?: string
    userEmail: string
    userName: string
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Use the database function for efficient threaded comment retrieval
    const { data: comments, error } = await supabase
      .rpc('get_threaded_comments', { poll_uuid: pollId })

    if (error) {
      console.error('Error fetching threaded comments:', error)
      return { success: false, error: 'Failed to fetch comments' }
    }

    // Filter comments based on approval status and user permissions
    const profile = await getCurrentUserProfile()
    const isAdmin = profile?.role === 'admin'
    
    const filteredComments = (comments || []).filter((comment: any) => {
      // Admins can see all comments
      if (isAdmin) return true
      
      // Users can see their own comments even if not approved
      if (profile && comment.user_id === profile.userId) return true
      
      // Everyone can see approved, non-hidden comments
      return comment.is_approved && !comment.is_hidden
    })

    return { 
      success: true, 
      data: filteredComments.map((comment: any) => ({
        id: comment.id,
        pollId: comment.poll_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        content: comment.content,
        depth: comment.depth,
        isApproved: comment.is_approved,
        isHidden: comment.is_hidden,
        moderatedBy: comment.moderated_by,
        moderatedAt: comment.moderated_at,
        moderationReason: comment.moderation_reason,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        userEmail: comment.user_email,
        userName: comment.user_name
      }))
    }
  } catch (error) {
    console.error('Error in getThreadedComments:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch comments' 
    }
  }
}

/**
 * Get comment count for a poll
 */
export async function getCommentCount(pollId: string): Promise<{
  success: boolean
  data?: { count: number }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
      .eq('is_approved', true)
      .eq('is_hidden', false)

    if (error) {
      console.error('Error fetching comment count:', error)
      return { success: false, error: 'Failed to fetch comment count' }
    }

    return { success: true, data: { count: count || 0 } }
  } catch (error) {
    console.error('Error in getCommentCount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch comment count' 
    }
  }
}