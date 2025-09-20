import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates Supabase client for browser-side operations
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
    throw new Error('Missing required Supabase environment variables')
  }

  console.log('Creating Supabase client with URL:', supabaseUrl)
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
