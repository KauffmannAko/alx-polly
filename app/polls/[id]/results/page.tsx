import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PollResultsPageProps {
  params: { id: string };
}

export default async function PollResultsPage({ params }: PollResultsPageProps) {
  const { id } = await params;
  const supabase = await createClient(cookies());

  // Optimized query: Get poll with options and vote counts in one query
  const { data: pollData, error } = await supabase
    .from('polls')
    .select(`
      *,
      options(id, text),
      votes(option_id)
    `)
    .eq('id', id)
    .single();

  if (error || !pollData) {
    notFound();
  }

  // Count votes per option
  const voteCount: Record<string, number> = {};
  const totalVotes = pollData.votes?.length || 0;
  
  pollData.votes?.forEach((vote: any) => {
    voteCount[vote.option_id] = (voteCount[vote.option_id] || 0) + 1;
  });
  
  // Add vote counts to options
  const poll = {
    ...pollData,
    options: pollData.options?.map((option: any) => ({
      ...option,
      votes: voteCount[option.id] || 0
    })) || [],
    totalVotes
  };

  const calculatePercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              <CardDescription>{poll.description}</CardDescription>
            </div>
            <div className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Results
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Poll Results</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Total votes: {poll.totalVotes}
            </p>
          </div>
          
          <div className="space-y-6">
            {poll.options.sort((a: any, b: any) => b.votes - a.votes).map((option: any) => (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.text}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{option.votes} votes</span>
                    <span className="text-sm font-bold">{calculatePercentage(option.votes)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${calculatePercentage(option.votes)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline">
            <Link href={`/polls/${id}`}>Back to Poll</Link>
          </Button>
          <Button asChild>
            <Link href="/polls">View All Polls</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}