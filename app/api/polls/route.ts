import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { validateUserAuthentication, validatePollData, sanitizeInput } from '@/lib/security';
import { addSecurityHeaders } from '@/lib/headers';
import { logPollOperation, logUnauthorizedAccess } from '@/lib/logger';

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
  
  return addSecurityHeaders(response);
}

/**
 * POST /api/polls - Create a new poll
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Enhanced authentication check
  const { user, error: authError } = await validateUserAuthentication();
  
  if (authError || !user) {
    logUnauthorizedAccess('unknown', 'polls', 'create', request.headers.get('x-forwarded-for') || 'unknown');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Enhanced validation
    const validation = validatePollData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid poll data', details: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const { title, description, options, duration } = {
      title: sanitizeInput(body.title),
      description: body.description ? sanitizeInput(body.description) : '',
      options: body.options.map((opt: string) => sanitizeInput(opt)),
      duration: body.duration
    };

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

    // Log successful poll creation
    logPollOperation('create', pollData.id, user.id, { title, optionsCount: options.length });

    const response = NextResponse.json({
      message: 'Poll created successfully',
      poll: pollData,
    }, { status: 201 });

    return addSecurityHeaders(response);

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create poll', details: error.message },
      { status: 500 }
    );
  }
}
