# Service Role Key Setup Guide

## Issue Resolved

You encountered a `supabaseKey is required` error because the `SUPABASE_SERVICE_ROLE_KEY` environment variable was missing from your `.env.local` file.

## Current Status

✅ **Middleware Updated**: Now handles missing service role key gracefully  
✅ **Application Running**: Server working without crashes  
✅ **Fallback Implemented**: Uses default permissions when service key is unavailable  

## What is the Service Role Key?

The **Service Role Key** is a special Supabase key that:
- Bypasses Row Level Security (RLS) policies
- Has full database access permissions
- Is used for admin operations and system-level tasks
- Should be kept secret and never exposed to the client

## How to Get Your Service Role Key

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `ahrhxegflzzeapzkooxo`

### Step 2: Navigate to API Settings
1. Click on **"Settings"** in the left sidebar
2. Click on **"API"** in the settings menu
3. Scroll down to the **"Project API keys"** section

### Step 3: Copy the Service Role Key
1. Find the **"service_role"** key (not the "anon" key)
2. Click the **"Copy"** button or **"Reveal"** to show the key
3. Copy the entire key (it starts with `eyJ...`)

### Step 4: Add to Environment Variables
1. Open your `.env.local` file
2. Replace the commented line with your actual key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ahrhxegflzzeapzkooxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocmh4ZWdmbHp6ZWFwemtvb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTM3OTksImV4cCI6MjA3MjEyOTc5OX0.E2v90d4mNzhW7EeqP8aluQ8UCEbhuCudhNb2NAb2Jpk
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### Step 5: Restart Your Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Current Behavior Without Service Role Key

The application now works gracefully without the service role key:

### ✅ What Works
- User authentication and registration
- Basic application functionality
- Profile creation for new users
- Public content access

### ⚠️ What's Limited
- Admin routes are restricted (`/admin/*`)
- RLS policy conflicts fallback to default permissions
- Some advanced role-based features may not work fully

## Benefits of Adding the Service Role Key

Once you add the service role key:

### 🚀 Enhanced Functionality
- **Admin Access**: Full admin dashboard functionality
- **RLS Bypass**: Resolves infinite recursion in policies
- **User Management**: Complete user role management
- **Content Moderation**: Full poll and comment moderation
- **System Operations**: Automated profile creation and management

### 🔒 Security Features
- Proper role-based access control
- Secure admin operations
- Protected system-level database operations

## Security Best Practices

### ✅ Do
- Keep the service role key in `.env.local` only
- Never commit `.env.local` to version control
- Use the service role key only for server-side operations
- Regularly rotate your API keys if needed

### ❌ Don't
- Never expose the service role key to the client-side
- Don't use it in `NEXT_PUBLIC_*` environment variables
- Don't share the key in public repositories
- Don't use it for regular user operations

## Troubleshooting

### Key Not Working?
1. Verify you copied the **service_role** key (not anon key)
2. Check for extra spaces or characters
3. Ensure the key starts with `eyJ`
4. Restart your development server after adding the key

### Still Getting RLS Errors?
1. Run the `fix-rls-policies.sql` script in Supabase
2. Verify the service role key is correctly set
3. Check Supabase dashboard for any policy conflicts

### Need to Reset?
If you need to regenerate your keys:
1. Go to Supabase Dashboard > Settings > API
2. Click "Reset" next to the service role key
3. Update your `.env.local` file with the new key

## Next Steps

1. **Add the service role key** following the steps above
2. **Run the RLS fix script** (`fix-rls-policies.sql`) in Supabase
3. **Test admin functionality** by accessing `/admin` routes
4. **Verify user management** works properly

Your application is currently functional without the service role key, but adding it will unlock the full feature set and resolve any remaining RLS policy issues.