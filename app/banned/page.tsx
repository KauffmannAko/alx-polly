import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ban, ArrowLeft, Mail } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function BannedPage() {
  const profile = await getCurrentUserProfile()
  
  // Redirect if user is not banned or doesn't exist
  if (!profile || profile.isActive) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Ban className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Account Suspended</CardTitle>
          <CardDescription>
            Your account has been suspended from ALX Polly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.banReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Reason for suspension:</h4>
              <p className="text-sm text-red-700">{profile.banReason}</p>
            </div>
          )}
          
          {profile.bannedAt && (
            <div className="text-center text-sm text-muted-foreground">
              Suspended on: {new Date(profile.bannedAt).toLocaleDateString()}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Appeal Process</h4>
                <p className="text-sm text-blue-700">
                  If you believe this suspension was made in error, please contact our support team to appeal this decision.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="mailto:support@alxpolly.com?subject=Account Suspension Appeal">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}