'use client'

import { useState } from 'react'
import { UserRole } from '@/types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MoreHorizontal, Shield, Ban, UserCheck, Crown } from 'lucide-react'
import { updateUserRole, banUser, unbanUser } from '@/lib/actions/user-management'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name?: string
  profile: {
    id: string
    userId: string
    role: UserRole
    isActive: boolean
    bannedAt?: string
    bannedBy?: string
    banReason?: string
    createdAt: string
    updatedAt?: string
  }
}

interface UserManagementTableProps {
  users: User[]
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'role' | 'ban' | 'unban' | null>(null)
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER)
  const [banReason, setBanReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    if (!selectedUser || !actionType) return

    setIsLoading(true)
    try {
      let result
      
      switch (actionType) {
        case 'role':
          result = await updateUserRole({
            userId: selectedUser.id,
            role: newRole
          })
          break
        case 'ban':
          result = await banUser({
            userId: selectedUser.id,
            reason: banReason
          })
          break
        case 'unban':
          result = await unbanUser({
            userId: selectedUser.id
          })
          break
      }

      if (result?.success) {
        toast.success(`User ${actionType === 'role' ? 'role updated' : actionType === 'ban' ? 'banned' : 'unbanned'} successfully`)
        router.refresh()
        closeDialog()
      } else {
        toast.error(result?.error || `Failed to ${actionType} user`)
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} user`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setSelectedUser(null)
    setActionType(null)
    setNewRole(UserRole.USER)
    setBanReason('')
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setActionType('role')
    setNewRole(user.profile.role)
  }

  const openBanDialog = (user: User) => {
    setSelectedUser(user)
    setActionType('ban')
  }

  const openUnbanDialog = (user: User) => {
    setSelectedUser(user)
    setActionType('unban')
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge variant="destructive" className="gap-1"><Crown className="h-3 w-3" />Admin</Badge>
      case UserRole.USER:
        return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />User</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean, bannedAt?: string) => {
    if (!isActive && bannedAt) {
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Banned</Badge>
    }
    return <Badge variant="default" className="gap-1"><UserCheck className="h-3 w-3" />Active</Badge>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.profile.role)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.profile.isActive, user.profile.bannedAt)}
                  {user.profile.banReason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Reason: {user.profile.banReason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.profile.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                        Change Role
                      </DropdownMenuItem>
                      {user.profile.isActive ? (
                        <DropdownMenuItem 
                          onClick={() => openBanDialog(user)}
                          className="text-red-600"
                        >
                          Ban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => openUnbanDialog(user)}
                          className="text-green-600"
                        >
                          Unban User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={actionType === 'role'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Role</Label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={UserRole.USER}>User</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={actionType === 'ban'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.name || selectedUser?.email} from the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Ban Reason</Label>
              <Textarea
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter the reason for banning this user..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleAction} 
              disabled={isLoading || !banReason.trim()}
            >
              {isLoading ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={actionType === 'unban'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>
              Restore access for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading}>
              {isLoading ? 'Unbanning...' : 'Unban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}