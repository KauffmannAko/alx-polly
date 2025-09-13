'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface Poll {
  id: string;
  title: string;
  description: string;
  created_at: string;
  active: boolean;
  votes: number;
  options: Array<{ id: string; text: string }>;
}

interface MyPollsClientProps {
  polls: Poll[];
}

/**
 * Client component for interactive poll management
 */
export default function MyPollsClient({ polls }: MyPollsClientProps) {
  const [pollsList, setPollsList] = useState(polls);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const { addToast, ToastContainer } = useToast();

  const handleDeletePoll = async (id: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) {
      return;
    }
    
    setDeletingPollId(id);
    
    try {
      console.log('Attempting to delete poll with ID:', id);
      
      const response = await fetch(`/api/polls/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || `Failed to delete poll (Status: ${response.status})`);
      }
      
      // Remove from local state
      setPollsList(pollsList.filter(poll => poll.id !== id));
      console.log('Poll deleted successfully');
      
      // Show success toast
      addToast('Poll deleted successfully!', 'success');
      
    } catch (error) {
      console.error('Error deleting poll:', error);
      addToast(`Failed to delete poll: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setDeletingPollId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Button asChild>
          <Link href="/create">Create New Poll</Link>
        </Button>
      </div>

      {pollsList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven't created any polls yet.</p>
          <Button asChild>
            <Link href="/create">Create Your First Poll</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pollsList.map((poll) => (
            <Card key={poll.id} className={deletingPollId === poll.id ? 'opacity-50 pointer-events-none relative' : ''}>
              {deletingPollId === poll.id && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                    <span className="text-sm text-gray-600">Deleting poll...</span>
                  </div>
                </div>
              )}
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
                  {poll.options.length} options • {poll.votes} votes
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
                    disabled={deletingPollId === poll.id}
                  >
                    {deletingPollId === poll.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      '✕'
                    )}
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
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
