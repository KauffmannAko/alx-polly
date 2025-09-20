'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  MessageSquare, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Reply, 
  Flag,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'
import { CommentForm } from './CommentForm'
import { deleteComment } from '@/lib/actions/comments'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
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
}

interface CommentThreadProps {
  comments: Comment[]
  currentUserId?: string
  currentUserRole?: string
  userEmail?: string
  userName?: string
  isLoggedIn?: boolean
}

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  currentUserId?: string
  currentUserRole?: string
  userEmail?: string
  userName?: string
  isLoggedIn?: boolean
  onReply: (commentId: string) => void
  replyingTo: string | null
  onCancelReply: () => void
}

function CommentItem({ 
  comment, 
  replies, 
  currentUserId, 
  currentUserRole,
  userEmail,
  userName,
  isLoggedIn = false,
  onReply, 
  replyingTo, 
  onCancelReply 
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  
  const isOwner = currentUserId === comment.userId
  const isAdmin = currentUserRole === 'admin'
  const canModerate = isAdmin
  const canEdit = isOwner && !comment.moderatedAt
  const canDelete = isOwner || isAdmin
  const canReply = comment.depth < 5 // Allow all users to reply, not just logged-in users

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    setIsDeleting(true)
    try {
      const result = await deleteComment(comment.id)
      if (result.success) {
        toast.success('Comment deleted successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete comment')
      }
    } catch (error) {
      toast.error('Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (comment.isHidden) {
      return <Badge variant="destructive" className="text-xs"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>
    }
    if (!comment.isApproved) {
      return <Badge variant="secondary" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>
    }
    return null
  }

  const indentLevel = Math.min(comment.depth, 5) * 24 // Max 5 levels of indentation

  return (
    <div style={{ marginLeft: `${indentLevel}px` }} className="space-y-2">
      <Card className={`${comment.isHidden ? 'opacity-60' : ''} ${!comment.isApproved ? 'border-yellow-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {comment.userName ? comment.userName.charAt(0).toUpperCase() : 
                   comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.userName || comment.userEmail}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                  {getStatusBadge()}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </div>
                {comment.moderationReason && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    <strong>Moderation reason:</strong> {comment.moderationReason}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {canReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReply(comment.id)}
                      className="h-7 px-2 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {(canEdit || canDelete || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                  {canModerate && !isOwner && (
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      Moderate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <CommentForm
          pollId={comment.pollId}
          parentId={comment.id}
          onCancel={onCancelReply}
          placeholder="Write a reply..."
          buttonText="Reply"
          userEmail={userEmail}
          userName={userName}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]} // Replies are handled recursively by the parent CommentThread
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              userEmail={userEmail}
              userName={userName}
              isLoggedIn={isLoggedIn}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentThread({ 
  comments, 
  currentUserId, 
  currentUserRole,
  userEmail,
  userName,
  isLoggedIn = false
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter(comment => !comment.parentId)

  // Function to get replies for a comment
  const getReplies = (parentId: string): Comment[] => {
    return comments.filter(comment => comment.parentId === parentId)
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium mb-1">No comments yet</p>
        <p className="text-sm">Be the first to share your thoughts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topLevelComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={getReplies(comment.id)}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          userEmail={userEmail}
          userName={userName}
          isLoggedIn={isLoggedIn}
          onReply={handleReply}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      ))}
    </div>
  )
}