-- Apply all necessary migrations to fix moderation issues
-- Run this script in your Supabase SQL Editor

-- 1. Add is_active column to polls table (if not exists)
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create index for is_active column for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON public.polls(is_active);

-- Update existing polls to be active by default
UPDATE public.polls 
SET is_active = true 
WHERE is_active IS NULL;

-- 2. Add parent_id column to comments table (if not exists)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 3. Add is_active column to comments table (if not exists)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_comments_is_active ON public.comments(is_active);

-- Update existing comments to be active by default
UPDATE public.comments 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.polls.is_active IS 'Indicates if the poll is active and can receive votes';
COMMENT ON COLUMN public.comments.parent_id IS 'Reference to parent comment for threaded discussions';
COMMENT ON COLUMN public.comments.is_active IS 'Indicates if the comment is active and visible';

-- Success message
SELECT 'Successfully applied all migrations for moderation functionality' AS message;