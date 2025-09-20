'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Menu, X, Shield, Settings, MessageSquare } from 'lucide-react';
import { UserRole, UserProfile, Permission } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Use the new client profile utility with fallback
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile(data.profile);
        }
      } else {
        console.error('Failed to fetch user profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    console.log('Current user before logout:', user?.email);
    console.log('Starting logout process...');
    
    // Immediately clear local auth state first
    if (typeof window !== 'undefined') {
      console.log('Clearing local storage and cookies...');
      
      // Clear all localStorage items that contain 'supabase'
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase')) {
          localStorage.removeItem(key);
          console.log(`Cleared localStorage: ${key}`);
        }
      });
      
      // Clear all cookies that contain 'supabase' or 'auth'
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`Cleared cookie: ${name}`);
        }
      });
    }
    
    // Try Supabase signOut in the background (don't wait for it)
    supabase.auth.signOut().then(() => {
      console.log('Supabase signOut completed successfully');
    }).catch((error) => {
      console.log('Supabase signOut failed (but local state already cleared):', error);
    });
    
    console.log('Redirecting to home page...');
    // Force a hard refresh to ensure auth state is completely reset
    window.location.href = '/';
  };

  const isAdmin = userProfile?.role === UserRole.ADMIN && userProfile?.isActive;
  const canCreatePoll = userProfile?.isActive;
  const canModerateComments = userProfile?.role === UserRole.ADMIN && userProfile?.isActive;

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl" aria-label="ALX Polly Home">
            ALX Polly
          </Link>
          <nav className="hidden md:flex gap-6" role="navigation" aria-label="Main navigation">
            <Link
              href="/polls"
              className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 ${pathname === '/polls' ? 'text-primary' : 'text-muted-foreground'}`}
              aria-current={pathname === '/polls' ? 'page' : undefined}
            >
              Polls
            </Link>
            {user && canCreatePoll && (
              <Link
                href="/create"
                className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 ${pathname === '/create' ? 'text-primary' : 'text-muted-foreground'}`}
                aria-current={pathname === '/create' ? 'page' : undefined}
              >
                Create Poll
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 flex items-center gap-1 ${pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
            {canModerateComments && (
              <Link
                href="/admin/comments"
                className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 flex items-center gap-1 ${pathname === '/admin/comments' ? 'text-primary' : 'text-muted-foreground'}`}
                aria-current={pathname === '/admin/comments' ? 'page' : undefined}
              >
                <MessageSquare className="h-4 w-4" />
                Moderate Comments
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`User menu for ${user.user_metadata.full_name || user.email}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata.avatar_url} 
                      alt={`${user.user_metadata.full_name || user.email} avatar`} 
                    />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                      {isAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {userProfile && !userProfile.isActive && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        Account Restricted
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="focus:outline-none">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-polls" className="focus:outline-none">My Polls</Link>
                </DropdownMenuItem>
                {canModerateComments && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/comments" className="focus:outline-none flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Moderate Comments
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="focus:outline-none flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="focus:outline-none cursor-pointer"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg md:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="container py-4 space-y-4">
              <Link
                href="/polls"
                className={`block text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-2 ${pathname === '/polls' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={pathname === '/polls' ? 'page' : undefined}
              >
                Polls
              </Link>
              {user && canCreatePoll && (
                <Link
                  href="/create"
                  className={`block text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-2 ${pathname === '/create' ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={pathname === '/create' ? 'page' : undefined}
                >
                  Create Poll
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`block text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-2 flex items-center gap-2 ${pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              )}
              {canModerateComments && (
                <Link
                  href="/admin/comments"
                  className={`block text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-2 flex items-center gap-2 ${pathname === '/admin/comments' ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={pathname === '/admin/comments' ? 'page' : undefined}
                >
                  <MessageSquare className="h-4 w-4" />
                  Moderate Comments
                </Link>
              )}
              {!user && (
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
                  </Button>
                </div>
              )}
              {user && userProfile && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between px-2 py-2">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    {isAdmin ? (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">User</Badge>
                    )}
                  </div>
                  {!userProfile.isActive && (
                    <div className="px-2 py-1">
                      <Badge variant="outline" className="text-xs w-full justify-center">
                        Account Restricted
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
