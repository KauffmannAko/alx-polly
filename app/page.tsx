import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:py-16">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Welcome to ALX Polly
        </h1>
        <p className="text-xl text-muted-foreground max-w-[700px]">
          Create, share, and participate in polls with ease.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Button asChild size="lg">
            <Link href="/create">Create a Poll</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/polls">Browse Polls</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Create Polls</CardTitle>
            <CardDescription>
              Design custom polls with multiple options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create polls with custom options, set duration, and share with others.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vote Easily</CardTitle>
            <CardDescription>
              Participate in polls with just one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Vote on polls shared with you and see results in real-time.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Results</CardTitle>
            <CardDescription>
              View detailed analytics for your polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Get insights with visual charts and detailed breakdowns of poll results.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
