'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { CommentForm } from './CommentForm'
import { CommentThread } from './CommentThread'
import { getThreadedComments } from '@/lib/actions/comments'
import { toast } from 'sonner'

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

interface CommentsSectionProps {
  pollId: string
  initialComments?: Comment[]
  currentUserId?: string
  currentUserRole?: string
  userEmail?: string
  userName?: string
  isLoggedIn?: boolean
}

export function CommentsSection({ 
  pollId, 
  initialComments = [],
  currentUserId,
  currentUserRole,
  userEmail,
  userName,
  isLoggedIn = false
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [isLoading, setIsLoading] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const result = await getThreadedComments(pollId)
      if (result.success && result.data) {
        setComments(result.data)
      } else {
        toast.error(result.error || 'Failed to load comments')
      }
    } catch (error) {
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  const approvedComments = comments.filter(comment => 
    comment.isApproved && !comment.isHidden
  )

  const commentCount = approvedComments.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({commentCount})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadComments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form - Now available to all users */}
        <div className="space-y-4">
          {!showCommentForm ? (
            <Button
              variant="outline"
              onClick={() => setShowCommentForm(true)}
              className="w-full justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add a comment...
            </Button>
          ) : (
            <CommentForm
              pollId={pollId}
              onCancel={() => setShowCommentForm(false)}
              userEmail={userEmail}
              userName={userName}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>

        <Separator />

        {/* Comments Thread */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2 text-muted-foreground">Loading comments...</span>
          </div>
        ) : (
          <CommentThread
            comments={comments}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            userEmail={userEmail}
            userName={userName}
            isLoggedIn={isLoggedIn}
          />
        )}
      </CardContent>
    </Card>
  )
}