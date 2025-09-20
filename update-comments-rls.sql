-- Update RLS policies for comments table to allow all users to view and add comments

-- First, add the missing columns to the comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Update the comments table to allow NULL user_id for guest comments
ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view approved comments" ON comments;
DROP POLICY IF EXISTS "Users can view their own comments" ON comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Admins can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Admins can update all comments" ON comments;

-- Create new policies that allow all users (including anonymous) to view approved comments
CREATE POLICY "Anyone can view approved comments" ON comments
  FOR SELECT
  USING (is_approved = true AND is_hidden = false);

-- Allow authenticated users to view their own comments (even if not approved)
CREATE POLICY "Users can view their own comments" ON comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all comments
CREATE POLICY "Admins can view all comments" ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Allow anyone (including anonymous users) to insert comments
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update their own comments
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to update all comments
CREATE POLICY "Admins can update all comments" ON comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Allow authenticated users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to delete all comments
CREATE POLICY "Admins can delete all comments" ON comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Add check constraint to ensure either user_id is provided OR both user_name and user_email are provided
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_user_info' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT check_user_info 
      CHECK (
        (user_id IS NOT NULL) OR 
        (user_name IS NOT NULL AND user_email IS NOT NULL)
      );
  END IF;
END $$;

-- Create index for better performance on guest comments
CREATE INDEX IF NOT EXISTS idx_comments_guest_info ON comments(user_email, user_name) WHERE user_id IS NULL;

-- Add table and column comments
COMMENT ON TABLE comments IS 'Comments on polls - supports both authenticated users and guest comments';
COMMENT ON COLUMN comments.user_id IS 'User ID for authenticated users, NULL for guest comments';
COMMENT ON COLUMN comments.user_name IS 'User name - from profile for authenticated users, provided for guests';
COMMENT ON COLUMN comments.user_email IS 'User email - from profile for authenticated users, provided for guests';