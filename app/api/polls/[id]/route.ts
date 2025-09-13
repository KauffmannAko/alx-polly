import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/polls/[id] - Get a specific poll with options and vote counts
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Optimized query with vote counts
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      *,
      options(id, text),
      votes(option_id)
    `)
    .eq('id', id)
    .single();
    
  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 });
  }
  
  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  // Count votes per option
  const voteCount: Record<string, number> = {};
  const totalVotes = poll.votes?.length || 0;
  
  poll.votes?.forEach((vote: any) => {
    voteCount[vote.option_id] = (voteCount[vote.option_id] || 0) + 1;
  });
  
  // Add vote counts to options
  const pollWithVotes = {
    ...poll,
    options: poll.options?.map((option: any) => ({
      ...option,
      votes: voteCount[option.id] || 0
    })) || [],
    totalVotes
  };

  const response = NextResponse.json({ poll: pollWithVotes });
  
  // Add caching headers
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  
  return response;
}

/**
 * PUT /api/polls/[id] - Update a poll
 * Requires authentication and ownership
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data?.user;
  
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { title, description } = body;
    
    // Check ownership
    const { data: existingPoll, error: pollCheckError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', id)
      .single();
      
    if (pollCheckError) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    
    if (existingPoll.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this poll' }, { status: 403 });
    }
    
    // Update poll
    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Poll updated successfully',
      poll: updatedPoll
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/polls/[id] - Delete a poll
 * Requires authentication and ownership
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data?.user;
  
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check ownership
  const { data: existingPoll, error: pollCheckError } = await supabase
    .from('polls')
    .select('user_id')
    .eq('id', id)
    .single();
    
  if (pollCheckError) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }
  
  if (existingPoll.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized to delete this poll' }, { status: 403 });
  }
  
  // Delete options first, then poll
  const { error: optionsDeleteError } = await supabase
    .from('options')
    .delete()
    .eq('poll_id', id);
    
  if (optionsDeleteError) {
    return NextResponse.json({ error: optionsDeleteError.message }, { status: 500 });
  }
  
  const { error: pollDeleteError } = await supabase
    .from('polls')
    .delete()
    .eq('id', id);
    
  if (pollDeleteError) {
    return NextResponse.json({ error: pollDeleteError.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Poll deleted successfully' });
}