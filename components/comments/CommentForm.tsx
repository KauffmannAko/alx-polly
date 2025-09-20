'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send, X } from 'lucide-react'
import { createComment } from '@/lib/actions/comments'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CommentFormProps {
  pollId: string
  parentId?: string
  onCancel?: () => void
  placeholder?: string
  buttonText?: string
  userEmail?: string
  userName?: string
  isLoggedIn?: boolean
}

export function CommentForm({ 
  pollId, 
  parentId, 
  onCancel, 
  placeholder = "Share your thoughts...",
  buttonText = "Post Comment",
  userEmail,
  userName,
  isLoggedIn = false
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('Please enter a comment')
      return
    }

    // For non-logged-in users, require name and email
    if (!isLoggedIn) {
      if (!guestName.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!guestEmail.trim()) {
        toast.error('Please enter your email')
        return
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        toast.error('Please enter a valid email address')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await createComment({
        pollId,
        content: content.trim(),
        parentId,
        guestName: !isLoggedIn ? guestName.trim() : undefined,
        guestEmail: !isLoggedIn ? guestEmail.trim() : undefined
      })

      if (result.success) {
        toast.success('Comment posted successfully!')
        setContent('')
        setGuestName('')
        setGuestEmail('')
        if (onCancel) onCancel() // Close reply form
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to post comment')
      }
    } catch (error) {
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isReply = !!parentId
  const displayName = isLoggedIn ? (userName || userEmail) : guestName
  const displayEmail = isLoggedIn ? userEmail : guestEmail

  return (
    <Card className={isReply ? "ml-8 mt-2" : ""}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {displayName ? displayName.charAt(0).toUpperCase() : 
                 displayEmail ? displayEmail.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {/* Guest user fields */}
              {!isLoggedIn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="guestName" className="text-xs">Name *</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="guestEmail" className="text-xs">Email *</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              )}
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                className="min-h-[80px] resize-none"
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {content.length}/2000 characters
                </div>
                <div className="flex items-center gap-2">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !content.trim() || (!isLoggedIn && (!guestName.trim() || !guestEmail.trim()))}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                        Posting...
                      </>
                    ) : (
                      <>
                        {isReply ? <MessageSquare className="h-4 w-4 mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                        {buttonText}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}