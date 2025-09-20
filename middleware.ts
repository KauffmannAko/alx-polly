import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole, Permission } from '@/types'
import { hasPermission } from '@/lib/permissions'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user (secure method)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Add debug logging for auth state
  console.log(`Middleware: ${pathname}, User: ${user?.email || 'none'}, Auth Error: ${authError?.message || 'none'}`)

  // Helper function to redirect with proper response handling
  const redirectTo = (url: string) => {
    console.log(`Middleware redirecting to: ${url}`)
    const redirectResponse = NextResponse.redirect(new URL(url, request.url))
    // Copy cookies from original response to redirect response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // Routes that require authentication
  const protectedRoutes = ['/profile', '/create', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && (!user || authError)) {
    return redirectTo('/login')
  }

  // If user is authenticated, check role-based permissions
  if (user && !authError) {
    try {
      // Get user profile with role information
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        // If user_profiles table doesn't exist, allow access with default user role
        if (error.code === 'PGRST205') {
          console.warn('user_profiles table not found, using default permissions')
          // Allow access but restrict admin routes
          if (pathname.startsWith('/admin')) {
            return redirectTo('/unauthorized')
          }
          return response
        }
        // Handle RLS infinite recursion error
         if (error.code === '42P17') {
           console.warn('RLS policy recursion detected')
           
           // Check if service role key is available
           if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
             try {
               console.log('Attempting service role bypass')
               // Try with service role to bypass RLS
               const serviceSupabase = createClient(
                 process.env.NEXT_PUBLIC_SUPABASE_URL!,
                 process.env.SUPABASE_SERVICE_ROLE_KEY!,
                 {
                   auth: {
                     autoRefreshToken: false,
                     persistSession: false
                   }
                 }
               )
               
               const { data: serviceProfile, error: serviceError } = await serviceSupabase
                 .from('user_profiles')
                 .select('*')
                 .eq('user_id', user.id)
                 .single()
                 
               if (!serviceError && serviceProfile) {
                 // Use the service profile data
                 profile = serviceProfile
               } else {
                 console.error('Service role profile fetch failed:', serviceError)
                 // Fallback to default permissions
                 if (pathname.startsWith('/admin')) {
                   return redirectTo('/unauthorized')
                 }
                 return response
               }
             } catch (serviceError) {
               console.error('Service role client creation failed:', serviceError)
               // Fallback to default permissions
               if (pathname.startsWith('/admin')) {
                 return redirectTo('/unauthorized')
               }
               return response
             }
           } else {
             console.warn('Service role key not configured, using default permissions')
             // Allow access but restrict admin routes when service key is missing
             if (pathname.startsWith('/admin')) {
               return redirectTo('/unauthorized')
             }
             return response
           }
         } else {
          // For other errors, redirect to error page
          return redirectTo('/error?message=Profile not found')
        }
      }

      if (!profile) {
        console.error('Profile not found for user:', user.id)
        return redirectTo('/error?message=Profile not found')
      }

      // Check if user is banned
      if (!profile.is_active) {
        return redirectTo('/banned')
      }

      const userRole = profile.role as UserRole

      // Admin routes - require admin role
      if (pathname.startsWith('/admin') && userRole !== UserRole.ADMIN) {
        return redirectTo('/unauthorized')
      }

      // Create poll route - require create permission
      if (pathname === '/create' && !hasPermission(userRole, Permission.CREATE_POLL)) {
        return redirectTo('/unauthorized')
      }

      // API routes protection
      if (pathname.startsWith('/api/admin') && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (pathname.startsWith('/api/moderate')) {
        const canModerate = hasPermission(userRole, Permission.MODERATE_POLLS) ||
                           hasPermission(userRole, Permission.MODERATE_COMMENTS)
        if (!canModerate) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      }

      // Add user info to request headers for downstream use
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-role', userRole)
      requestHeaders.set('x-user-active', profile.is_active.toString())

      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Middleware error:', error)
      return redirectTo('/error?message=Authentication error')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (SVG, images, etc.)
     * - Chrome DevTools and browser requests
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|\\.well-known).*)',
  ],
}