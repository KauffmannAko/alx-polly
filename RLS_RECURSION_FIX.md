# RLS Infinite Recursion Fix Guide

## Problem
You're experiencing a `42P17` error: "infinite recursion detected in policy for relation 'user_profiles'". This occurs when RLS policies reference the same table they're protecting, creating a circular dependency.

## Root Cause
The current RLS policies on `user_profiles` table are causing recursion:
- Admin policies check if a user is admin by querying `user_profiles` table
- This creates a loop: policy → query user_profiles → policy → query user_profiles → ...

## Solution Steps

### Step 1: Run the SQL Fix
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the entire content from `fix-rls-policies.sql`
4. Execute the script

### Step 2: Verify the Fix
After running the SQL script, test the API call:
```bash
curl 'https://ahrhxegflzzeapzkooxo.supabase.co/rest/v1/user_profiles?select=*&user_id=eq.7c9055fc-0db8-46f2-900a-501b52043b7c' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'authorization: Bearer YOUR_JWT_TOKEN'
```

### Step 3: Application Changes
The fix changes how admin permissions work:
- **Before**: RLS policies handled admin access automatically
- **After**: Application code must use service role for admin operations

## What the Fix Does

1. **Removes Recursive Policies**: Drops all existing policies that query the same table they're protecting
2. **Creates Safe Policies**: New policies that only use `auth.uid()` for user identification
3. **Adds Protection Trigger**: Creates a trigger to prevent users from changing role/status fields
4. **Adds Admin Function**: Creates `is_admin()` function with SECURITY DEFINER to bypass RLS
5. **Enables Service Role Access**: Allows service role to manage all profiles and comments
6. **Creates Admin View**: Provides `admin_user_profiles` view for admin operations

## Testing
After applying the fix:
- Regular users can access their own profile
- Admin operations work through service role
- No more infinite recursion errors

## Next Steps
1. Run the SQL script in Supabase
2. Test the user profile API endpoint
3. Verify admin functionality still works
4. Update any admin-related code to use service role if needed

## Troubleshooting
If you still see recursion errors:
1. Check if all old policies were dropped
2. Verify the new policies are created
3. Ensure service role key is properly configured
4. Clear any cached queries in your application