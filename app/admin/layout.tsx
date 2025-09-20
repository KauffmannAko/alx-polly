import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/permissions'
import { UserRole } from '@/types'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()
  
  // Redirect if not admin
  if (!profile || profile.role !== UserRole.ADMIN || !profile.isActive) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}