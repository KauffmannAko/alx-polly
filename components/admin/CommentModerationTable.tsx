'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Check, Eye, EyeOff, Trash2, AlertTriangle, MessageSquare } from 'lucide-react'
import { moderateComment } from '@/lib/actions/moderation'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
  isApproved?: boolean
  isHidden?: boolean
  moderatedAt?: string
  moderationReason?: string
  user: {
    id: string
    email: string
    name?: string
  }
  poll: {
    id: string
    title: string
  }
}

interface CommentModerationTableProps {
  comments: Comment[]
}

export function CommentModerationTable({ comments }: CommentModerationTableProps) {
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'hide' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    if (!selectedComment || !actionType) return

    setIsLoading(true)
    try {
      const result = await moderateComment({
        commentId: selectedComment.id,
        action: actionType,
        reason: reason.trim() || undefined
      })

      if (result?.success) {
        toast.success(`Comment ${actionType}d successfully`)
        router.refresh()
        closeDialog()
      } else {
        toast.error(result?.error || `Failed to ${actionType} comment`)
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} comment`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setSelectedComment(null)
    setActionType(null)
    setReason('')
  }

  const openActionDialog = (comment: Comment, action: 'approve' | 'hide' | 'delete') => {
    setSelectedComment(comment)
    setActionType(action)
  }

  const getStatusBadge = (comment: Comment) => {
    if (comment.isHidden) {
      return <Badge variant="destructive" className="gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>
    }
    if (comment.isApproved === false) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />Pending</Badge>
    }
    if (comment.isApproved === true) {
      return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Approved</Badge>
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const getActionLabel = () => {
    switch (actionType) {
      case 'approve': return 'Approve'
      case 'hide': return 'Hide'
      case 'delete': return 'Delete'
      default: return 'Action'
    }
  }

  const getActionColor = () => {
    switch (actionType) {
      case 'approve': return 'default'
      case 'hide': return 'secondary'
      case 'delete': return 'destructive'
      default: return 'default'
    }
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No comments require moderation at this time.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Poll</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <div>
                    <div className="text-sm">{truncateContent(comment.content)}</div>
                    {comment.moderationReason && (
                      <div className="text-xs text-orange-600 mt-1">
                        Reason: {comment.moderationReason}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{comment.user.name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{comment.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium line-clamp-1">{comment.poll.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(comment)}
                </TableCell>
                <TableCell>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!comment.isApproved && (
                        <DropdownMenuItem onClick={() => openActionDialog(comment, 'approve')}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {!comment.isHidden && (
                        <DropdownMenuItem onClick={() => openActionDialog(comment, 'hide')}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => openActionDialog(comment, 'delete')}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionLabel()} Comment</DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Approve this comment to make it visible to all users.'}
              {actionType === 'hide' && 'Hide this comment from public view.'}
              {actionType === 'delete' && 'Permanently delete this comment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedComment && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Comment on: {selectedComment.poll.title}</div>
                <div className="text-sm">{selectedComment.content}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  By {selectedComment.user.name || selectedComment.user.email}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter the reason for ${actionType}ing this comment...`}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button 
              variant={getActionColor() as any}
              onClick={handleAction} 
              disabled={isLoading}
            >
              {isLoading ? `${getActionLabel()}ing...` : getActionLabel()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}