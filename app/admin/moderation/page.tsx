import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PollModerationTable } from '@/components/admin/PollModerationTable'
import { CommentModerationTable } from '@/components/admin/CommentModerationTable'
import { getPollsForModeration, getCommentsForModeration } from '@/lib/actions/moderation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default async function ModerationPage() {
  const [pollsResult, commentsResult] = await Promise.all([
    getPollsForModeration(),
    getCommentsForModeration()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate polls and comments on the platform.
        </p>
      </div>

      <Tabs defaultValue="polls" className="space-y-6">
        <TabsList>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="polls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Poll Moderation ({pollsResult.success ? pollsResult.data?.length || 0 : 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!pollsResult.success ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {pollsResult.error || 'Failed to load polls'}
                  </AlertDescription>
                </Alert>
              ) : (
                <PollModerationTable polls={pollsResult.data || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Comment Moderation ({commentsResult.success ? commentsResult.data?.length || 0 : 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!commentsResult.success ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {commentsResult.error || 'Failed to load comments'}
                  </AlertDescription>
                </Alert>
              ) : (
                <CommentModerationTable comments={commentsResult.data || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}