import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export default async function PollsPage() {
  const supabase = await createClient(cookies());
  const { data: pollsData, error } = await supabase.from("polls").select("*");

  if (error) {
    console.error("Error fetching polls:", error);
    // Handle the error appropriately
    return <div>Error fetching polls.</div>;
  }

  // Fetch vote counts for all polls
  const pollIds = pollsData.map(p => p.id);
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('poll_id')
    .in('poll_id', pollIds);

  if (votesError) {
    console.error("Error fetching votes:", votesError);
    return <div>Error fetching vote counts.</div>;
  }

  // Create a map of pollId to vote count
  const voteCounts = votesData.reduce((acc, vote) => {
    acc[vote.poll_id] = (acc[vote.poll_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Combine polls with their vote counts
  const polls = pollsData.map(poll => ({
    ...poll,
    votes: voteCounts[poll.id] || 0,
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Polls</h1>
        <Button asChild>
          <Link href="/create">Create Poll</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(polls || []).map((poll) => (
          <Card key={poll.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
              <CardDescription>{poll.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">
                {(poll.options || []).length} options • {poll.votes || 0} votes
              </p>
              <div className="space-y-1">
                {(poll.options || []).slice(0, 3).map((option: string, index: number) => (
                  <div key={index} className="text-sm">{option}</div>
                ))}
                {(poll.options || []).length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{(poll.options || []).length - 3} more options
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/polls/${poll.id}`}>Vote on Poll</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/polls/${poll.id}/results`}>📊 View Results</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}