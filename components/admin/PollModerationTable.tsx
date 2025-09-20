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
import { MoreHorizontal, Check, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react'
import { moderatePoll } from '@/lib/actions/moderation'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Poll {
  id: string
  title: string
  description?: string
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
  _count: {
    votes: number
    comments: number
  }
}

interface PollModerationTableProps {
  polls: Poll[]
}

export function PollModerationTable({ polls }: PollModerationTableProps) {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'hide' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    if (!selectedPoll || !actionType) return

    setIsLoading(true)
    try {
      const result = await moderatePoll({
        pollId: selectedPoll.id,
        action: actionType,
        reason: reason.trim() || undefined
      })

      if (result?.success) {
        toast.success(`Poll ${actionType}d successfully`)
        router.refresh()
        closeDialog()
      } else {
        toast.error(result?.error || `Failed to ${actionType} poll`)
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} poll`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setSelectedPoll(null)
    setActionType(null)
    setReason('')
  }

  const openActionDialog = (poll: Poll, action: 'approve' | 'hide' | 'delete') => {
    setSelectedPoll(poll)
    setActionType(action)
  }

  const getStatusBadge = (poll: Poll) => {
    if (poll.isHidden) {
      return <Badge variant="destructive" className="gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>
    }
    if (poll.isApproved === false) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />Pending</Badge>
    }
    if (poll.isApproved === true) {
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

  if (polls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No polls require moderation at this time.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poll</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {polls.map((poll) => (
              <TableRow key={poll.id}>
                <TableCell>
                  <div>
                    <div className="font-medium line-clamp-1">{poll.title}</div>
                    {poll.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {poll.description}
                      </div>
                    )}
                    {poll.moderationReason && (
                      <div className="text-xs text-orange-600 mt-1">
                        Reason: {poll.moderationReason}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{poll.user.name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{poll.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(poll)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{poll._count.votes} votes</div>
                    <div className="text-muted-foreground">{poll._count.comments} comments</div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(poll.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!poll.isApproved && (
                        <DropdownMenuItem onClick={() => openActionDialog(poll, 'approve')}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {!poll.isHidden && (
                        <DropdownMenuItem onClick={() => openActionDialog(poll, 'hide')}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => openActionDialog(poll, 'delete')}
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
            <DialogTitle>{getActionLabel()} Poll</DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Approve this poll to make it visible to all users.'}
              {actionType === 'hide' && 'Hide this poll from public view.'}
              {actionType === 'delete' && 'Permanently delete this poll and all associated data.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPoll && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedPoll.title}</h4>
                {selectedPoll.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedPoll.description}</p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter the reason for ${actionType}ing this poll...`}
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