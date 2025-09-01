import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto py-16 px-4 md:px-6 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex flex-col max-w-[600px] space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-2">
              <span className="mr-1">✨</span> Simple. Fast. Insightful.
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Make Better Decisions with ALX Polly
            </h1>
            <p className="text-xl text-gray-600 max-w-[550px]">
              Create engaging polls, gather insights, and visualize results in real-time. Share with anyone, anywhere.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">
                <Link href="/create">Create a Poll</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl px-8">
                <Link href="/polls">Browse Polls</Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full max-w-[600px] h-[300px] md:h-[400px]">
            <Image 
              src="/hero-illustration.svg" 
              alt="Poll Illustration" 
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-16 px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need for Polling</h2>
          <p className="text-xl text-gray-600 max-w-[700px] mx-auto">Powerful features to create, share, and analyze polls with ease.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-indigo-50 p-6 flex justify-center">
              <Image src="/create-poll.svg" alt="Create Polls" width={80} height={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create Polls</CardTitle>
              <CardDescription className="text-gray-600">
                Design custom polls with multiple options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Create polls with custom options, set duration, and share with others using unique links or QR codes.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-0">
                <Link href="/create" className="flex items-center">Get Started <span className="ml-2">→</span></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-indigo-50 p-6 flex justify-center">
              <Image src="/vote-poll.svg" alt="Vote Easily" width={80} height={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Vote Easily</CardTitle>
              <CardDescription className="text-gray-600">
                Participate in polls with just one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Vote on polls shared with you and see results in real-time. No account required for voting.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-0">
                <Link href="/polls" className="flex items-center">Browse Polls <span className="ml-2">→</span></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-indigo-50 p-6 flex justify-center">
              <Image src="/track-results.svg" alt="Track Results" width={80} height={80} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Track Results</CardTitle>
              <CardDescription className="text-gray-600">
                View detailed analytics for your polls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Get insights with visual charts and detailed breakdowns of poll results. Export data for further analysis.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-0">
                <Link href="/my-polls" className="flex items-center">View Your Polls <span className="ml-2">→</span></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto py-16 px-4 md:px-6 mb-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create your first poll?</h2>
          <p className="text-xl mb-8 max-w-[600px] mx-auto">Join thousands of users who make better decisions with ALX Polly.</p>
          <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 rounded-xl px-8">
            <Link href="/create">Get Started Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
