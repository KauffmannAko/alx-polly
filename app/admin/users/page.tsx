import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { AdminStats } from '@/components/admin/AdminStats'
import { getAllUsers, getUserStats } from '@/lib/actions/user-management'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function UserManagementPage() {
  const [usersResult, statsResult] = await Promise.all([
    getAllUsers(),
    getUserStats()
  ])

  if (!usersResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user roles, permissions, and account status.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {usersResult.error || 'Failed to load users'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const users = usersResult.data || []
  const stats = statsResult.success ? statsResult.data : {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.profile.isActive).length,
    bannedUsers: users.filter(u => !u.profile.isActive).length,
    adminUsers: users.filter(u => u.profile.role === 'admin').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and account status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              <Settings className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <AdminStats stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagementTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}