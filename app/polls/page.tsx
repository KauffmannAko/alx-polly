import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { getCurrentUserProfile } from "@/lib/utils/auth";
import { UserRole } from "@/types";
import { Shield, Eye, EyeOff } from "lucide-react";

export default async function PollsPage() {
  const supabase = await createClient(cookies());
  const userProfile = await getCurrentUserProfile();
  const isAdmin = userProfile?.role === UserRole.ADMIN && userProfile?.isActive;
  
  // Optimized query: Get polls with options and vote counts in a single query
  const { data: pollsData, error } = await supabase
    .from("polls")
    .select(`
      *,
      options(id, text),
      votes(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching polls:", error);
    return <div>Error fetching polls.</div>;
  }

  // Process the data to include vote counts
  const polls = pollsData?.map(poll => ({
    ...poll,
    votes: poll.votes?.[0]?.count || 0,
    options: poll.options || []
  })) || [];

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Available Polls</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/create" aria-label="Create a new poll">Create Poll</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="list">
        {(polls || []).map((poll) => (
          <Card key={poll.id} className="flex flex-col hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all duration-200" role="listitem">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <CardTitle className="line-clamp-2 text-lg sm:text-xl leading-tight flex-1">{poll.title}</CardTitle>
                <div className="flex flex-col gap-1 items-end">
                  {poll.profiles?.role === UserRole.ADMIN && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isAdmin && (
                    <div className="flex gap-1">
                      {!poll.is_approved && (
                        <Badge variant="destructive" className="text-xs">
                          Pending
                        </Badge>
                      )}
                      {poll.is_hidden && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm sm:text-base line-clamp-2">{poll.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow px-4 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3" aria-label={`${(poll.options || []).length} options, ${poll.votes || 0} votes`}>
                {(poll.options || []).length} options • {poll.votes || 0} votes
              </p>
              <div className="space-y-1" aria-label="Poll options preview">
                {(poll.options || []).slice(0, 3).map((option: {id: string, text: string}, index: number) => (
                  <div key={option.id} className="text-xs sm:text-sm text-gray-700 line-clamp-1">{option.text}</div>
                ))}
                {(poll.options || []).length > 3 && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    +{(poll.options || []).length - 3} more options
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 px-4 sm:px-6 pt-3 sm:pt-4">
              <Button asChild variant="outline" className="w-full min-h-[44px] text-sm sm:text-base">
                <Link href={`/polls/${poll.id}`} aria-label={`Vote on poll: ${poll.title}`}>Vote on Poll</Link>
              </Button>
              <div className="flex gap-2 w-full">
                <Button asChild variant="ghost" className="flex-1 min-h-[44px] text-sm sm:text-base">
                  <Link href={`/polls/${poll.id}/results`} aria-label={`View results for poll: ${poll.title}`}>
                    <span aria-hidden="true">📊</span> View Results
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                    <Link href={`/admin/moderation?poll=${poll.id}`} aria-label={`Moderate poll: ${poll.title}`}>
                      <Shield className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}