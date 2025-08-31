'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

function MyPollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchPolls = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('polls')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching polls:', error);
        } else {
          setPolls(data);
        }
      }
    };

    fetchPolls();
  }, [user, supabase]);

  const handleDeletePoll = (id: string) => {
    // Delete poll logic will go here
    console.log(`Delete poll with id: ${id}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Button asChild>
          <Link href="/create">Create New Poll</Link>
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven't created any polls yet.</p>
          <Button asChild>
            <Link href="/create">Create Your First Poll</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(polls || []).map((poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
                    <CardDescription>{poll.description}</CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${poll.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {poll.active ? 'Active' : 'Closed'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {(poll.options || []).length} options • {poll.votes || 0} votes
                </p>
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(poll.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/polls/${poll.id}`}>View Results</Link>
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDeletePoll(poll.id)}
                >
                  ✕
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(MyPollsPage);