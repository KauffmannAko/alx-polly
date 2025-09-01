import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/polls/[id] - Get a specific poll
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  
  const supabase = await createClient();
  
  // Get poll with its options
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*, options(*)')
    .eq('id', id)
    .single();
    
  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 });
  }
  
  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }
  
  return NextResponse.json({ poll });
}

// PUT /api/polls/[id] - Update a poll
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  
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
    
    const { title, description } = body;
    
    // Check if poll exists and belongs to user
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
    
    // Update the poll
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
      message: `Poll updated successfully`,
      poll: updatedPoll
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    );
  }
}

// DELETE /api/polls/[id] - Delete a poll
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  
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
  
  // Check if poll exists and belongs to user
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
  
  // Delete the poll and its options
  // First delete the options
  const { error: optionsDeleteError } = await supabase
    .from('options')
    .delete()
    .eq('poll_id', id);
    
  if (optionsDeleteError) {
    return NextResponse.json({ error: optionsDeleteError.message }, { status: 500 });
  }
  
  // Then delete the poll
  const { error: pollDeleteError } = await supabase
    .from('polls')
    .delete()
    .eq('id', id);
    
  if (pollDeleteError) {
    return NextResponse.json({ error: pollDeleteError.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Poll deleted successfully' });
}