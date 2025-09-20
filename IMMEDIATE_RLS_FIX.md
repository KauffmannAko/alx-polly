# Immediate RLS Recursion Fix - Action Required

## Current Status
❌ **RLS Infinite Recursion Error Active**
- Error Code: `42P17`
- Issue: "infinite recursion detected in policy for relation 'user_profiles'"
- Impact: User profile queries failing, admin functions broken

## Immediate Actions Required

### Option 1: Quick Fix (Recommended)
**Run the SQL script to fix RLS policies:**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ahrhxegflzzeapzkooxo`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Fix**
   - Copy the entire content from `fix-rls-policies.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute
   - **Note**: If you get a "42P01: missing FROM-clause entry for table 'old'" error, the script has been updated to fix this issue

4. **Verify Success**
   - You should see: "RLS policies fixed! Infinite recursion issue resolved."

### Option 2: Temporary Workaround
**Add service role key for immediate relief:**

1. **Get Service Role Key**
   - In Supabase Dashboard > Settings > API
   - Copy the "service_role" key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

2. **Update .env.local**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ahrhxegflzzeapzkooxo.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocmh4ZWdmbHp6ZWFwemtvb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTM3OTksImV4cCI6MjA3MjEyOTc5OX0.E2v90d4mNzhW7EeqP8aluQ8UCEbhuCudhNb2NAb2Jpk
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

3. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Why This Happens

The RLS policies on `user_profiles` table create a circular dependency:
```
User requests profile → RLS policy checks if user is admin → 
Queries user_profiles table → RLS policy checks if user is admin → 
Queries user_profiles table → INFINITE LOOP
```

## What Each Fix Does

### SQL Fix (Option 1)
- ✅ Removes recursive policies permanently
- ✅ Creates safe, non-recursive policies
- ✅ Adds admin function that bypasses RLS
- ✅ Long-term solution

### Service Role Key (Option 2)
- ✅ Provides immediate workaround
- ✅ Middleware can bypass RLS when recursion occurs
- ⚠️ Temporary solution - still need SQL fix

## Testing After Fix

Test the problematic API call:
```bash
curl 'https://ahrhxegflzzeapzkooxo.supabase.co/rest/v1/user_profiles?select=*&user_id=eq.7c9055fc-0db8-46f2-900a-501b52043b7c' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocmh4ZWdmbHp6ZWFwemtvb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTM3OTksImV4cCI6MjA3MjEyOTc5OX0.E2v90d4mNzhW7EeqP8aluQ8UCEbhuCudhNb2NAb2Jpk' \
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjA1SEgxaHRNVU5ac0psd2ciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Focmh4ZWdmbHp6ZWFwemtvb3hvLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3YzkwNTVmYy0wZGI4LTQ2ZjItOTAwYS01MDFiNTIwNDNiN2MiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4Mzc3OTA1LCJpYXQiOjE3NTgzNzQzMDUsImVtYWlsIjoia2F1ZmZtYW5uLnRyYW5zc2lvbkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoia2F1ZmZtYW5uLnRyYW5zc2lvbkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoidGVzdCBuYW1lICIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiN2M5MDU1ZmMtMGRiOC00NmYyLTkwMGEtNTAxYjUyMDQzYjdjIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTgzNzQzMDV9XSwic2Vzc2lvbl9pZCI6ImFiZjc0Y2FjLWMwNTUtNDlhYi04MTdjLThhNmJmN2Y1YzQxMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.YiE3cORlvZpY4FLG7fP3OhIC6RY6cR4x9pWSaZngAnE'
```

**If you encounter SQL errors during the fix:**
- Error "42P01: missing FROM-clause entry for table 'old'" has been resolved in the updated script
- Make sure to use the latest version of `fix-rls-policies.sql`
```

**Expected Result After Fix:**
- ✅ No `42P17` error
- ✅ Returns user profile data
- ✅ Application works normally

## Priority
🚨 **HIGH PRIORITY** - This error breaks core functionality

**Recommended Action:** Execute Option 1 (SQL Fix) immediately for permanent resolution.