'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Loader from '@/components/ui/loader';

/**
 * My Polls Page - Dashboard showing user's created polls
 */
function MyPollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    fetchPolls();
  }, [user, supabase]);

  const handleDeletePoll = async (id: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/polls/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete poll');
      }
      
      // Remove from local state
      setPolls(polls.filter(poll => poll.id !== id));
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll. Please try again.');
    }
  };

  if (loading) {
    return <Loader />;
  }

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
              <CardFooter className="flex flex-col gap-2">
                <div className="flex justify-between gap-2 w-full">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/polls/${poll.id}`}>Vote</Link>
                  </Button>
                  <Button asChild variant="secondary" className="flex-1" style={{ backgroundColor: '#4f46e5', color: 'white' }}>
                    <Link href={`/edit/${poll.id}`}>✏️ Edit</Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDeletePoll(poll.id)}
                  >
                    ✕
                  </Button>
                </div>
                <Button asChild variant="ghost" className="w-full">
                  <Link href={`/polls/${poll.id}/results`}>📊 View Results</Link>
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