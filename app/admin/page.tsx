import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminStats } from '@/components/admin/AdminStats'
import { Button } from '@/components/ui/button'
import { getUserStats } from '@/lib/actions/user-management'
import { getModerationStats } from '@/lib/actions/moderation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Shield, Eye, AlertTriangle, MessageSquare, Settings, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [userStatsResult, moderationStatsResult] = await Promise.all([
    getUserStats(),
    getModerationStats()
  ])

  if (!userStatsResult.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your polling application and monitor system activity.
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {userStatsResult.error || 'Failed to load dashboard data'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const userStats = userStatsResult.data
  const moderationStats = moderationStatsResult.success ? moderationStatsResult.data : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, moderate content, and view system statistics.
        </p>
      </div>

      {/* Enhanced Stats Overview */}
      <AdminStats stats={userStats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage user accounts, roles, and permissions. View all registered users and their activity status.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Comment Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Review and moderate poll comments. Approve, reject, or remove inappropriate content.
            </p>
            <div className="flex gap-2">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/admin/comments">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Moderate
                </Link>
              </Button>
              {moderationStats && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {moderationStats.pendingComments} pending
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-orange-600" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View comprehensive system statistics and monitor platform activity.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold">{userStats.totalPolls}</div>
                <div className="text-muted-foreground">Polls</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold">{userStats.totalVotes}</div>
                <div className="text-muted-foreground">Votes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userStats?.bannedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with banned accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userStats?.adminUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Poll Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{(moderationStats?.totalModeratedPolls || 0) + (moderationStats?.pendingPolls || 0)}</div>
                <div className="text-sm text-muted-foreground">Total Polls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{moderationStats?.totalModeratedPolls || 0}</div>
                <div className="text-sm text-muted-foreground">Moderated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{moderationStats?.pendingPolls || 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-muted-foreground">Hidden</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Comment Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{(moderationStats?.totalModeratedComments || 0) + (moderationStats?.pendingComments || 0)}</div>
                <div className="text-sm text-muted-foreground">Total Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{moderationStats?.totalModeratedComments || 0}</div>
                <div className="text-sm text-muted-foreground">Moderated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{moderationStats?.pendingComments || 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-muted-foreground">Hidden</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/admin/users"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <Users className="h-5 w-5" />
              Manage Users
            </a>
            <a
              href="/admin/moderation"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <Eye className="h-5 w-5" />
              Moderate Content
            </a>
            <a
              href="/admin/analytics"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
            >
              <Shield className="h-5 w-5" />
              View Analytics
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}