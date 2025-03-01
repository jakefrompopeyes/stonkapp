import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const isPopup = requestUrl.searchParams.get('popup') === 'true';
  const timestamp = requestUrl.searchParams.get('t'); // Get timestamp for debugging

  console.log('[DEBUG] Auth callback received:', { 
    hasCode: !!code, 
    error, 
    error_description,
    url: request.url,
    isPopup,
    timestamp,
    time: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries()),
    cookies: request.cookies.getAll().map(c => c.name)
  });

  // Handle OAuth errors
  if (error) {
    console.error('[DEBUG] OAuth error:', error, error_description, new Date().toISOString());
    
    // For all redirects, go back to the sign-in page with the error
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      console.log('[DEBUG] Exchanging code for session...', new Date().toISOString());
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[DEBUG] Error exchanging code for session:', error, new Date().toISOString());
        
        // For all redirects, go back to the sign-in page with the error
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      console.log('[DEBUG] Session exchange successful', new Date().toISOString());
      
      // For all redirects, go to the profile page
      console.log('[DEBUG] Redirecting to profile page', new Date().toISOString());
      return NextResponse.redirect(new URL('/profile', requestUrl.origin));
    } catch (err) {
      console.error('[DEBUG] Unexpected error during authentication:', err, new Date().toISOString());
      
      // For all redirects, go back to the sign-in page with a generic error
      return NextResponse.redirect(
        new URL('/auth/signin?error=An unexpected error occurred during authentication', requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to sign-in page
  console.log('[DEBUG] No code present, redirecting to sign-in page', new Date().toISOString());
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
} 