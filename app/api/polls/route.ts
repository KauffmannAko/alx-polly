import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/polls - Get all polls
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('polls').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ polls: data });
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
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
    
    const { title, description, options, duration } = body;

    if (!title || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Invalid poll data. Title and at least 2 options are required.' },
        { status: 400 }
      );
    }

    // Insert the poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        user_id: user.id,
        duration: parseInt(duration, 10) || 7, // Default to 7 days
      })
      .select()
      .single();

    if (pollError) {
      throw new Error(pollError.message);
    }

    // Insert the options
    const optionsToInsert = options.map((optionText: string) => ({
      text: optionText,
      poll_id: pollData.id,
    }));

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);

    if (optionsError) {
      // If options fail, clean up the created poll
      await supabase.from('polls').delete().eq('id', pollData.id);
      throw new Error(optionsError.message);
    }

    return NextResponse.json({
      message: 'Poll created successfully',
      poll: pollData,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create poll', details: error.message },
      { status: 500 }
    );
  }
}
