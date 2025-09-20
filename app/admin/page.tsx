import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserStats } from '@/lib/actions/user-management'
import { getModerationStats } from '@/lib/actions/moderation'
import { Users, Shield, Eye, AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  const [userStatsResult, moderationStatsResult] = await Promise.all([
    getUserStats(),
    getModerationStats()
  ])

  const userStats = userStatsResult.success ? userStatsResult.data : null
  const moderationStats = moderationStatsResult.success ? moderationStatsResult.data : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, moderate content, and view system statistics.
        </p>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with active accounts
            </p>
          </CardContent>
        </Card>

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
                <div className="text-2xl font-bold">{moderationStats?.polls.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Polls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{moderationStats?.polls.approved || 0}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{moderationStats?.polls.pending || 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{moderationStats?.polls.hidden || 0}</div>
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
                <div className="text-2xl font-bold">{moderationStats?.comments.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{moderationStats?.comments.approved || 0}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{moderationStats?.comments.pending || 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{moderationStats?.comments.hidden || 0}</div>
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