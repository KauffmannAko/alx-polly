# Database Setup Instructions

## Issue Resolution

You're experiencing `PGRST205` errors because the `user_profiles` table doesn't exist in your Supabase database. This table is required for the role-based access control (RBAC) system.

## Quick Fix Applied

I've temporarily modified the middleware to handle missing `user_profiles` table gracefully:
- Users can now access the application without infinite redirects
- Admin routes are restricted until the database is properly set up
- The application logs warnings instead of crashing

## Database Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Access the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the setup script**
   - Copy the entire contents of `setup-database.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the setup**
   - Go to "Table Editor" in the sidebar
   - You should see the new `user_profiles` and `comments` tables

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## What the Setup Script Creates

### Tables
- **`user_profiles`**: Extends auth.users with role information
- **`comments`**: Stores poll comments with moderation features

### Features
- **Role-based access control**: Admin and user roles
- **User moderation**: Ban/unban functionality
- **Content moderation**: Approve/hide polls and comments
- **Automatic profile creation**: New users get profiles automatically
- **Row Level Security**: Proper data access policies

### Indexes
- Optimized queries for role lookups
- Fast filtering by active status
- Efficient comment and poll associations

## Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing the Setup

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Check the logs**
   - You should no longer see `PGRST205` errors
   - The application should load without redirect loops

3. **Test user registration**
   - Register a new user
   - Check that a profile is automatically created in `user_profiles`

4. **Test admin functionality**
   - Manually set a user's role to 'admin' in the database
   - Verify admin routes are accessible

## Troubleshooting

### Still getting PGRST205 errors?
- Verify the script ran successfully in Supabase
- Check that the `user_profiles` table exists
- Ensure your Supabase keys are correct

### Permission errors?
- Verify Row Level Security policies are created
- Check that your service role key has proper permissions

### Need to reset?
```sql
-- Drop tables if you need to start over
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

## Next Steps

After setting up the database:
1. The infinite redirect issue will be resolved
2. User registration will work properly
3. Admin features will be fully functional
4. Poll and comment moderation will be available

For any issues, check the browser console and server logs for specific error messages.