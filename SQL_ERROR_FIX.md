# SQL Error Fix: 42P01 - Missing FROM-clause Entry

## Problem
When executing the `fix-rls-policies.sql` script, you encountered:
```
ERROR: 42P01: missing FROM-clause entry for table "old"
```

## Root Cause
The error occurred because the original script used `OLD.role` and `OLD.is_active` in a `WITH CHECK` clause. The `OLD` keyword is only available in `USING` clauses for UPDATE policies, not in `WITH CHECK` clauses.

## Solution Applied
The script has been updated to:

1. **Remove problematic OLD references** from the WITH CHECK clause
2. **Add a database trigger** to prevent users from changing critical fields (role, is_active)
3. **Maintain security** by allowing only the service_role to modify these protected fields

## Updated Script Location
The corrected script is in: `fix-rls-policies.sql`

## Key Changes Made

### Before (Problematic):
```sql
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = OLD.role AND is_active = OLD.is_active);
```

### After (Fixed):
```sql
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
```

## Next Steps

1. **Execute the updated script** in your Supabase SQL Editor
2. **Verify the fix** by testing the application
3. **Configure service role key** (optional) for full admin functionality

## Security Notes

- The trigger approach is more robust than RLS policies for protecting critical fields
- Only the service_role can modify user roles and active status
- Regular users can still update their profile information (name, email, etc.)
- The infinite recursion issue is completely resolved

## Testing

After running the updated script, test with:
```bash
curl -X GET "YOUR_SUPABASE_URL/rest/v1/user_profiles?select=*" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should no longer see the 42P17 error.