import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { getAllUsers } from '@/lib/actions/user-management'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default async function UserManagementPage() {
  const result = await getAllUsers()

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and account status.
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {result.error || 'Failed to load users'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const users = result.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles, permissions, and account status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagementTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}