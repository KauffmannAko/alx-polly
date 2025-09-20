import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { UserRole, Permission } from '@/types';
import { hasPermission } from '@/lib/permissions';

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requireRole?: UserRole;
  requirePermissions?: Permission[];
  requireAnyPermission?: Permission[];
  redirectTo?: string;
}

/**
 * Authentication and authorization middleware
 */
export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const {
    requireAuth = false,
    requireRole,
    requirePermissions = [],
    requireAnyPermission = [],
    redirectTo = '/login'
  } = options;

  // If no auth requirements, allow through
  if (!requireAuth && !requireRole && requirePermissions.length === 0 && requireAnyPermission.length === 0) {
    return null;
  }

  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Check if user is authenticated
    if (authError || !user) {
      if (requireAuth || requireRole || requirePermissions.length > 0 || requireAnyPermission.length > 0) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      return null;
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from<any>('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.redirect(new URL('/error?message=Profile not found', request.url));
    }

    // Check if user is active (not banned)
    if (!profile.is_active) {
      return NextResponse.redirect(new URL('/banned', request.url));
    }

    const userRole = profile.role as UserRole;

    // Check role requirement
    if (requireRole && userRole !== requireRole) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Check specific permissions requirement (all must be present)
    if (requirePermissions.length > 0) {
      const hasAllPermissions = requirePermissions.every(permission => 
        hasPermission(userRole, permission)
      );
      if (!hasAllPermissions) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Check any permission requirement (at least one must be present)
    if (requireAnyPermission.length > 0) {
      const hasAnyPermissions = requireAnyPermission.some(permission => 
        hasPermission(userRole, permission)
      );
      if (!hasAnyPermissions) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-active', profile.is_active.toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/error?message=Authentication error', request.url));
  }
}

/**
 * Higher-order function to create route-specific auth middleware
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  return (request: NextRequest) => authMiddleware(request, options);
}

/**
 * Predefined middleware configurations
 */
export const requireAuth = createAuthMiddleware({ requireAuth: true });
export const requireAdmin = createAuthMiddleware({ requireRole: UserRole.ADMIN });
export const requireModerator = createAuthMiddleware({ 
  requireAnyPermission: [Permission.MODERATE_POLLS, Permission.MODERATE_COMMENTS] 
});
export const requireUserManagement = createAuthMiddleware({ 
  requirePermissions: [Permission.MANAGE_USERS] 
});