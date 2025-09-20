-- Apply threaded comments migration
-- This script creates the get_threaded_comments function and related functionality

-- Add parent_id column for threaded comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add depth column to track nesting level (optional, for performance)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0 NOT NULL;

-- Create index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Create index for threaded queries (poll_id, parent_id, created_at)
CREATE INDEX IF NOT EXISTS idx_comments_threaded ON public.comments(poll_id, parent_id, created_at);

-- Function to get comment thread depth
CREATE OR REPLACE FUNCTION public.get_comment_depth(comment_parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_depth INTEGER := 0;
  current_parent UUID := comment_parent_id;
BEGIN
  -- Traverse up the parent chain to calculate depth
  WHILE current_parent IS NOT NULL LOOP
    current_depth := current_depth + 1;
    SELECT parent_id INTO current_parent 
    FROM public.comments 
    WHERE id = current_parent;
    
    -- Prevent infinite loops (safety check)
    IF current_depth > 10 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_depth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set depth on insert/update
CREATE OR REPLACE FUNCTION public.set_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.depth = public.get_comment_depth(NEW.parent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_depth_trigger
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_comment_depth();

-- Function to get threaded comments for a poll
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
GRANT EXECUTE ON FUNCTION public.get_comment_depth(UUID) TO authenticated;

-- Success message
SELECT 'Threaded comments migration applied successfully!' AS message;