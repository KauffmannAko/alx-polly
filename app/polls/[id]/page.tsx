'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import Loader from '@/components/ui/loader';

/**
 * Poll Detail Page - Display poll and handle voting
 */
export default function PollDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const router = useRouter();
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  useEffect(() => {
    async function fetchPollData() {
      try {
        setLoading(true);
        
        // Optimized query: Get poll with options and vote counts in one query
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select(`
            *,
            options(id, text),
            votes(option_id, user_id)
          `)
          .eq('id', id)
          .single();
          
        if (pollError) {
          throw new Error('Failed to fetch poll data');
        }
        
        if (!pollData) {
          throw new Error('Poll not found');
        }
        
        // Count votes per option
        const voteCount: Record<string, number> = {};
        const totalVotes = pollData.votes?.length || 0;
        
        pollData.votes?.forEach((vote: any) => {
          voteCount[vote.option_id] = (voteCount[vote.option_id] || 0) + 1;
        });
        
        // Add vote counts to options
        const pollWithVotes = {
          ...pollData,
          options: pollData.options?.map((option: any) => ({
            ...option,
            votes: voteCount[option.id] || 0
          })) || [],
          totalVotes
        };
        
        setPoll(pollWithVotes);
        
        // Check if user already voted
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          const userVote = pollData.votes?.find((vote: any) => vote.user_id === user.user.id);
          if (userVote) {
            setUserVoted(true);
            setHasVoted(true);
          }
        }
      } catch (err: any) {
        console.error('Error fetching poll data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPollData();
  }, [id, supabase]);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId: selectedOption }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // If user is not authenticated (401 or auth session missing), redirect to login
        if (response.status === 401 || errorData.error === 'Auth session missing!') {
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to submit vote');
      }
      
      setHasVoted(true);
      
      // Refresh poll data
      const pollResponse = await fetch(`/api/polls/${id}`);
      const { poll: updatedPoll } = await pollResponse.json();
      setPoll(updatedPoll);
    } catch (err: any) {
      console.error('Error submitting vote:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-red-500">Error: {error}</p>
        <Button asChild className="mt-4">
          <Link href="/polls">Back to Polls</Link>
        </Button>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Poll not found</p>
        <Button asChild className="mt-4">
          <Link href="/polls">Back to Polls</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <Card className="max-w-3xl mx-auto" role="main" aria-labelledby="poll-title">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <CardTitle id="poll-title" className="text-xl sm:text-2xl leading-tight">{poll.title}</CardTitle>
              <CardDescription className="mt-2 text-sm sm:text-base">{poll.description}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href={`/polls/${id}/results`} aria-label={`View detailed results for ${poll.title}`}>View Results</Link>
            </Button>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-2">
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4" role="radiogroup" aria-labelledby="poll-title" aria-describedby="poll-instructions">
            <div id="poll-instructions" className="sr-only">
              {hasVoted ? 'Poll results are displayed below' : 'Select an option to vote'}
            </div>
            {poll.options.map((option: any, index: number) => (
              <div 
                key={option.id} 
                className={`border rounded-lg p-3 sm:p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                  hasVoted ? 'cursor-default' : 'cursor-pointer hover:border-primary/50'
                } ${
                  selectedOption === option.id && !hasVoted ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
                role={hasVoted ? 'article' : 'radio'}
                aria-checked={hasVoted ? undefined : selectedOption === option.id}
                aria-labelledby={`option-${option.id}-text`}
                tabIndex={hasVoted ? -1 : 0}
                onKeyDown={(e) => {
                  if (!hasVoted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedOption(option.id);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span id={`option-${option.id}-text`} className="font-medium text-sm sm:text-base leading-tight">{option.text}</span>
                  {hasVoted && (
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground sm:text-foreground" aria-label={`${calculatePercentage(option.votes)} percent of votes`}>
                      {calculatePercentage(option.votes)}%
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden" role="progressbar" aria-valuenow={calculatePercentage(option.votes)} aria-valuemin={0} aria-valuemax={100} aria-label={`${option.text}: ${calculatePercentage(option.votes)}% of votes`}>
                    <div 
                      className="bg-primary h-full transition-all duration-300" 
                      style={{ width: `${calculatePercentage(option.votes)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 w-full px-4 sm:px-6 pt-4 sm:pt-6">
          {!hasVoted ? (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption || isSubmitting}
              className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              aria-describedby={!selectedOption ? 'vote-error' : undefined}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-between w-full items-start sm:items-center gap-3 sm:gap-4">
              <div className="text-sm text-muted-foreground" aria-live="polite">
                Total votes: {poll.totalVotes}
              </div>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/polls/${id}/results`} aria-label={`See detailed results for ${poll.title}`}>See Detailed Results</Link>
              </Button>
            </div>
          )}
          {!hasVoted && !selectedOption && (
            <div id="vote-error" className="sr-only" aria-live="polite">
              Please select an option before submitting your vote
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}