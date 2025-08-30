import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/polls/[id]/vote - Vote on a poll
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  
  // Get the current user
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data?.user;
  
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate request body
    if (!body.optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      );
    }
    
    // Check if poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id')
      .eq('id', id)
      .single();
      
    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    
    // Check if option exists and belongs to the poll
    const { data: option, error: optionError } = await supabase
      .from('options')
      .select('id')
      .eq('id', body.optionId)
      .eq('poll_id', id)
      .single();
      
    if (optionError || !option) {
      return NextResponse.json({ error: 'Option not found or does not belong to this poll' }, { status: 400 });
    }
    
    // Check if user has already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', id)
      .eq('user_id', user.id);
      
    if (existingVote && existingVote.length > 0) {
      return NextResponse.json({ error: 'You have already voted on this poll' }, { status: 400 });
    }
    
    // Record the vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: id,
        option_id: body.optionId,
        user_id: user.id
      })
      .select()
      .single();
      
    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: `Vote recorded successfully`,
      vote
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}