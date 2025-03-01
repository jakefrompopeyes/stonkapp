import { createClient } from '@supabase/supabase-js';

// These values should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

// Create a single supabase client for interacting with your database
// Configure with localStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Explicitly use localStorage for session persistence
    // This ensures the session is saved between page refreshes and browser restarts
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for more secure authentication
  },
  // Set global fetch options to ensure cookies are sent with requests
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      return fetch(url, options);
    },
    headers: {
      'X-Client-Info': 'supabase-js-v2',
    },
  },
}); 