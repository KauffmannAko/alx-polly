-- Fix the get_threaded_comments function to resolve column type mismatch
-- This script corrects the inconsistent SELECT statements in the recursive CTE

CREATE OR REPLACE FUNCTION public.get_threaded_comments(poll_uuid UUID)
RETURNS TABLE (
  id UUID,
  poll_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  depth INTEGER,
  is_approved BOOLEAN,
  is_hidden BOOLEAN,
  moderated_by UUID,
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments (FIXED - now includes all moderation fields)
    SELECT 
      c.id, c.poll_id, c.user_id, c.parent_id, c.content, c.depth,
      c.is_approved, c.is_hidden, c.moderated_by, c.moderated_at, c.moderation_reason,
      c.created_at, c.updated_at,
      au.email::TEXT as user_email,
      COALESCE(au.raw_user_meta_data->>'name', au.email)::TEXT as user_name,
      ARRAY[c.created_at] as sort_path
    FROM public.comments c
    JOIN auth.users au ON c.user_id = au.id
    WHERE c.poll_id = poll_uuid AND c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child comments (consistent with base case)
    SELECT 
      c.id, c.poll_id, c.user_id, c.parent_id, c.content, c.depth,
      c.is_approved, c.is_hidden, c.moderated_by, c.moderated_at, c.moderation_reason,
      c.created_at, c.updated_at,
      au.email::TEXT as user_email,
      COALESCE(au.raw_user_meta_data->>'name', au.email)::TEXT as user_name,
      ct.sort_path || c.created_at
    FROM public.comments c
    JOIN auth.users au ON c.user_id = au.id
    JOIN comment_tree ct ON c.parent_id = ct.id
    WHERE c.depth <= 5  -- Limit nesting depth
  )
  SELECT 
    ct.id, ct.poll_id, ct.user_id, ct.parent_id, ct.content, ct.depth,
    ct.is_approved, ct.is_hidden, ct.moderated_by, ct.moderated_at, ct.moderation_reason,
    ct.created_at, ct.updated_at, ct.user_email, ct.user_name
  FROM comment_tree ct
  ORDER BY ct.sort_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_threaded_comments(UUID) TO authenticated;

SELECT 'Threaded comments function fixed successfully!' AS message;