-- Add is_active column to polls table
-- This column is required for moderation functionality

-- Add is_active column to polls table
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create index for is_active column for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON public.polls(is_active);

-- Update existing polls to be active by default
UPDATE public.polls 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.polls.is_active IS 'Indicates if the poll is active and can receive votes';

-- Success message
SELECT 'Successfully added is_active column to polls table' AS message;