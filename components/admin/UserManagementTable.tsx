'use client'

import { useState } from 'react'
import { UserRole, Permission } from '@/types'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  MoreHorizontal, 
  Shield, 
  Ban, 
  UserCheck, 
  Crown, 
  ChevronDown, 
  ChevronRight,
  Settings,
  Eye,
  Trash2,
  UserX
} from 'lucide-react'
import { updateUserRole, banUser, unbanUser } from '@/lib/actions/user-management'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Client-safe permission utilities (copied from permissions.ts)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.CREATE_POLL,
    Permission.EDIT_OWN_POLL,
    Permission.DELETE_OWN_POLL,
    Permission.VOTE_ON_POLL,
    Permission.VIEW_POLL,
    Permission.MANAGE_USERS,
    Permission.MODERATE_POLLS,
    Permission.MODERATE_COMMENTS,
    Permission.VIEW_ANALYTICS,
    Permission.DELETE_ANY_POLL,
    Permission.BAN_USERS,
  ],
  [UserRole.USER]: [
    Permission.CREATE_POLL,
    Permission.EDIT_OWN_POLL,
    Permission.DELETE_OWN_POLL,
    Permission.VOTE_ON_POLL,
    Permission.VIEW_POLL,
  ],
};

function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.USER:
      return 'User';
    default:
      return 'Unknown';
  }
}

function getPermissionDisplayName(permission: Permission): string {
  switch (permission) {
    case Permission.CREATE_POLL:
      return 'Create Polls';
    case Permission.EDIT_OWN_POLL:
      return 'Edit Own Polls';
    case Permission.DELETE_OWN_POLL:
      return 'Delete Own Polls';
    case Permission.VOTE_ON_POLL:
      return 'Vote on Polls';
    case Permission.VIEW_POLL:
      return 'View Polls';
    case Permission.MANAGE_USERS:
      return 'Manage Users';
    case Permission.MODERATE_POLLS:
      return 'Moderate Polls';
    case Permission.MODERATE_COMMENTS:
      return 'Moderate Comments';
    case Permission.VIEW_ANALYTICS:
      return 'View Analytics';
    case Permission.DELETE_ANY_POLL:
      return 'Delete Any Poll';
    case Permission.BAN_USERS:
      return 'Ban Users';
    default:
      return 'Unknown Permission';
  }
}

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const router = useRouter()

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedRows(newExpanded)
  }

  const getUserPermissions = (role: UserRole): Permission[] => {
    const allPermissions = Object.values(Permission)
    return allPermissions.filter(permission => hasPermission(role, permission))
  }

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
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[200px]">Quick Actions</TableHead>
              <TableHead className="w-[70px]">More</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <>
                <TableRow key={user.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(user.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedRows.has(user.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
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
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                            className="h-7 px-2"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Change Role</TooltipContent>
                      </Tooltip>
                      
                      {user.profile.isActive ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBanDialog(user)}
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ban User</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUnbanDialog(user)}
                              className="h-7 px-2 text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Unban User</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleRowExpansion(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {expandedRows.has(user.id) ? 'Hide Details' : 'View Details'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        {user.profile.isActive ? (
                          <DropdownMenuItem 
                            onClick={() => openBanDialog(user)}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => openUnbanDialog(user)}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Unban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                
                {/* Expanded row with permissions */}
                {expandedRows.has(user.id) && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/50">
                      <div className="py-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">User Permissions</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {getUserPermissions(user.profile.role).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {getPermissionDisplayName(permission)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>User ID:</strong> {user.id}
                          </div>
                          <div>
                            <strong>Profile ID:</strong> {user.profile.id}
                          </div>
                          <div>
                            <strong>Created:</strong> {new Date(user.profile.createdAt).toLocaleString()}
                          </div>
                          {user.profile.updatedAt && (
                            <div>
                              <strong>Last Updated:</strong> {new Date(user.profile.updatedAt).toLocaleString()}
                            </div>
                          )}
                          {user.profile.bannedAt && (
                            <>
                              <div>
                                <strong>Banned At:</strong> {new Date(user.profile.bannedAt).toLocaleString()}
                              </div>
                              {user.profile.bannedBy && (
                                <div>
                                  <strong>Banned By:</strong> {user.profile.bannedBy}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
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
            
            {/* Show permissions preview */}
            <div>
              <Label>Permissions for {getRoleDisplayName(newRole)}</Label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="grid grid-cols-1 gap-1 text-sm">
                  {getUserPermissions(newRole).map((permission) => (
                    <div key={permission} className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-600" />
                      {getPermissionDisplayName(permission)}
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">
                This will restore full access to the platform for this user.
              </p>
              {selectedUser?.profile.banReason && (
                <div className="mt-2">
                  <strong className="text-sm">Original ban reason:</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedUser.profile.banReason}
                  </p>
                </div>
              )}
            </div>
          </div>
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
    </TooltipProvider>
  )
}