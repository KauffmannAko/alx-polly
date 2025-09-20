import { UserRole, Permission, User, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// Role-based permissions mapping
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

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get current user's profile with role information
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.user_id,
    role: profile.role as UserRole,
    isActive: profile.is_active,
    bannedAt: profile.banned_at,
    bannedBy: profile.banned_by,
    banReason: profile.ban_reason,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

/**
 * Check if current user has a specific permission
 */
export async function currentUserHasPermission(permission: Permission): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isActive) {
    return false;
  }
  return hasPermission(profile.role, permission);
}

/**
 * Check if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === UserRole.ADMIN && profile.isActive;
}

/**
 * Check if current user can moderate content
 */
export async function canCurrentUserModerate(): Promise<boolean> {
  return await currentUserHasPermission(Permission.MODERATE_POLLS) ||
         await currentUserHasPermission(Permission.MODERATE_COMMENTS);
}

/**
 * Check if user owns a resource (poll, comment, etc.)
 */
export function isResourceOwner(userId: string, resourceCreatorId: string): boolean {
  return userId === resourceCreatorId;
}

/**
 * Check if current user can edit a specific poll
 */
export async function canEditPoll(pollCreatorId: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isActive) {
    return false;
  }

  // Admins can edit any poll
  if (profile.role === UserRole.ADMIN) {
    return true;
  }

  // Users can only edit their own polls
  return isResourceOwner(profile.userId, pollCreatorId) && 
         hasPermission(profile.role, Permission.EDIT_OWN_POLL);
}

/**
 * Check if current user can delete a specific poll
 */
export async function canDeletePoll(pollCreatorId: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isActive) {
    return false;
  }

  // Admins can delete any poll
  if (hasPermission(profile.role, Permission.DELETE_ANY_POLL)) {
    return true;
  }

  // Users can only delete their own polls
  return isResourceOwner(profile.userId, pollCreatorId) && 
         hasPermission(profile.role, Permission.DELETE_OWN_POLL);
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const hasAccess = await currentUserHasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Access denied: Missing permission ${permission}`);
  }
}

/**
 * Require admin role or throw error
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Access denied: Admin role required');
  }
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.USER:
      return 'User';
    default:
      return 'Unknown';
  }
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: Permission): string {
  const displayNames: Record<Permission, string> = {
    [Permission.CREATE_POLL]: 'Create Polls',
    [Permission.EDIT_OWN_POLL]: 'Edit Own Polls',
    [Permission.DELETE_OWN_POLL]: 'Delete Own Polls',
    [Permission.VOTE_ON_POLL]: 'Vote on Polls',
    [Permission.VIEW_POLL]: 'View Polls',
    [Permission.MANAGE_USERS]: 'Manage Users',
    [Permission.MODERATE_POLLS]: 'Moderate Polls',
    [Permission.MODERATE_COMMENTS]: 'Moderate Comments',
    [Permission.VIEW_ANALYTICS]: 'View Analytics',
    [Permission.DELETE_ANY_POLL]: 'Delete Any Poll',
    [Permission.BAN_USERS]: 'Ban Users',
  };
  return displayNames[permission] || permission;
}