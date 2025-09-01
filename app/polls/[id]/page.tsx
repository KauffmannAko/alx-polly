'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
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
        const response = await fetch(`/api/polls/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch poll data');
        }
        
        const data = await response.json();
        
        // Get votes for this poll
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', id);
          
        if (votesError) {
          throw new Error('Failed to fetch votes');
        }
        
        // Count votes per option
        const voteCount: Record<string, number> = {};
        votesData.forEach((vote) => {
          voteCount[vote.option_id] = (voteCount[vote.option_id] || 0) + 1;
        });
        
        // Add vote counts to options
        const pollWithVotes = {
          ...data.poll,
          options: data.poll.options.map((option: any) => ({
            ...option,
            votes: voteCount[option.id] || 0
          })),
          totalVotes: votesData.length
        };
        
        setPoll(pollWithVotes);
        
        // Check if user has already voted
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          const { data: userVote } = await supabase
            .from('votes')
            .select('id')
            .eq('poll_id', id)
            .eq('user_id', user.user.id);
            
          if (userVote && userVote.length > 0) {
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
        throw new Error(errorData.error || 'Failed to submit vote');
      }
      
      setHasVoted(true);
      
      // Refresh poll data to show updated results
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
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading poll...</p>
      </div>
    );
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
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              <CardDescription>{poll.description}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/polls/${id}/results`}>View Results</Link>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poll.options.map((option: any) => (
              <div 
                key={option.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${hasVoted ? 'cursor-default' : ''} ${
                  selectedOption === option.id && !hasVoted ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-medium">
                      {calculatePercentage(option.votes)}%
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: `${calculatePercentage(option.votes)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 w-full">
          {!hasVoted ? (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          ) : (
            <div className="flex justify-between w-full items-center">
              <div className="text-sm text-muted-foreground">
                Total votes: {poll.totalVotes}
              </div>
              <Button asChild variant="secondary">
                <Link href={`/polls/${id}/results`}>See Detailed Results</Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}