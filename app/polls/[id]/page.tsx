'use client';

import { useState } from 'react';
import { use } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  
  // Mock data for a single poll
  const poll = {
    id,
    title: "What's your favorite programming language?",
    description: "Vote for your preferred programming language",
    options: [
      { id: "1", text: "JavaScript", votes: 42 },
      { id: "2", text: "Python", votes: 35 },
      { id: "3", text: "Java", votes: 28 },
      { id: "4", text: "C#", votes: 20 },
      { id: "5", text: "Go", votes: 15 },
    ],
    totalVotes: 140,
    createdAt: "2023-10-15",
    createdBy: "John Doe",
  };

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setHasVoted(true);
      setIsSubmitting(false);
    }, 1000);
  };

  const calculatePercentage = (votes: number) => {
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
          <div className="text-sm text-muted-foreground mt-2">
            Created by {poll.createdBy} on {new Date(poll.createdAt).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poll.options.map((option) => (
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
        <CardFooter className="flex flex-col items-start gap-4">
          {!hasVoted ? (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Total votes: {poll.totalVotes}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}