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
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <Card className="max-w-3xl mx-auto" role="main" aria-labelledby="poll-results-title">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <CardTitle id="poll-results-title" className="text-xl sm:text-2xl leading-tight">{poll.title}</CardTitle>
              <CardDescription className="mt-2 text-sm sm:text-base">{poll.description}</CardDescription>
            </div>
            <div className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 self-start" aria-label="Poll results page">
              Results
            </div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-2">
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium mb-2">Poll Results</h3>
            <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
              Total votes: {poll.totalVotes}
            </p>
          </div>
          
          <div className="space-y-4 sm:space-y-6" role="list" aria-label="Poll results by option">
            {poll.options.sort((a: any, b: any) => b.votes - a.votes).map((option: any, index: number) => (
              <div key={option.id} className="space-y-2" role="listitem">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="font-medium text-sm sm:text-base leading-tight" id={`result-option-${option.id}`}>{option.text}</span>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground sm:text-foreground" aria-label={`${option.votes} votes`}>{option.votes} votes</span>
                    <span className="font-bold" aria-label={`${calculatePercentage(option.votes)} percent`}>{calculatePercentage(option.votes)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={calculatePercentage(option.votes)} aria-valuemin={0} aria-valuemax={100} aria-labelledby={`result-option-${option.id}`} aria-describedby={`result-desc-${option.id}`}>
                  <div 
                    className="bg-primary h-full transition-all duration-300" 
                    style={{ width: `${calculatePercentage(option.votes)}%` }}
                  />
                </div>
                <div id={`result-desc-${option.id}`} className="sr-only">
                  {option.text} received {option.votes} votes, which is {calculatePercentage(option.votes)}% of total votes
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <Button asChild variant="outline" className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base">
            <Link href={`/polls/${id}`} aria-label={`Back to poll: ${poll.title}`}>Back to Poll</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base">
            <Link href="/polls" aria-label="View all available polls">View All Polls</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}