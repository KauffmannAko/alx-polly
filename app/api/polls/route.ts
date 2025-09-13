import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/polls - Get all polls
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Optimized query with proper joins
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      options(id, text),
      votes(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process the data to include vote counts
  const polls = data?.map(poll => ({
    ...poll,
    votes: poll.votes?.[0]?.count || 0,
    options: poll.options || []
  })) || [];

  const response = NextResponse.json({ polls });
  
  // Add caching headers
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  
  return response;
}

/**
 * POST /api/polls - Create a new poll
 * Requires authentication
 */
export async function POST(request: NextRequest) {
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
    const { title, description, options, duration } = body;

    // Validate required fields
    if (!title || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Invalid poll data. Title and at least 2 options are required.' },
        { status: 400 }
      );
    }

    // Create poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        user_id: user.id,
        duration: parseInt(duration, 10) || 7,
      })
      .select()
      .single();

    if (pollError) {
      throw new Error(pollError.message);
    }

    // Create poll options
    const optionsToInsert = options.map((optionText: string) => ({
      text: optionText,
      poll_id: pollData.id,
    }));

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);

    if (optionsError) {
      // Cleanup if options creation fails
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
