'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * HOC that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 */
export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuth = (props: P) => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    if (loading) {
      return <div>Loading...</div>
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...props} />
  }

  return WithAuth
}
