import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MyPollsClient from './MyPollsClient';

/**
 * My Polls Page - Dashboard showing user's created polls
 */
export default async function MyPollsPage() {
  const supabase = await createClient(cookies());
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Optimized query: Get user's polls with options, vote counts, and moderation status
  const { data: pollsData, error } = await supabase
    .from('polls')
    .select(`
      *,
      options(id, text),
      votes(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching polls:', error);
    return <div>Error fetching polls.</div>;
  }

  // Process the data to include vote counts
  const polls = pollsData?.map(poll => ({
    ...poll,
    votes: poll.votes?.[0]?.count || 0,
    options: poll.options || []
  })) || [];

  return <MyPollsClient polls={polls} />;
}