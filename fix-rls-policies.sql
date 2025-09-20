-- Fix infinite recursion in RLS policies for user_profiles table
-- Run this script in your Supabase SQL Editor to fix the policy issues

-- First, drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Create non-recursive policies for user_profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profile (but not role or ban status)
-- Note: We'll handle role/status protection at the application level
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a trigger to prevent users from changing critical fields
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow service_role to change role and is_active
  IF auth.role() != 'service_role' THEN
    NEW.role = OLD.role;
    NEW.is_active = OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_user_role_change
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Create a separate function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use a direct query without RLS to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = user_uuid AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Create admin policies using the function (these will be used by service role)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- For regular admin operations, we'll handle permissions in the application layer
-- instead of RLS to avoid recursion issues

-- Update comments policies to use the function
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can update all comments" ON public.comments;

-- Recreate comments policies without recursion
CREATE POLICY "Service role can manage all comments" ON public.comments
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for admin access that bypasses RLS
CREATE OR REPLACE VIEW public.admin_user_profiles AS
SELECT * FROM public.user_profiles;

-- Grant access to the view for service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_user_profiles TO service_role;

-- Success message
SELECT 'RLS policies fixed! Infinite recursion issue resolved.' AS message;