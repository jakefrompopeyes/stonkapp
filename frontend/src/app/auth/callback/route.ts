import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('Auth callback received:', { 
    hasCode: !!code, 
    error, 
    error_description,
    url: request.url
  });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      console.log('Exchanging code for session...');
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
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      console.log('Session exchange successful, redirecting to profile page');
      // Redirect to profile page on successful authentication
      return NextResponse.redirect(new URL('/profile', requestUrl.origin));
    } catch (err) {
      console.error('Unexpected error during authentication:', err);
      return NextResponse.redirect(
        new URL('/auth/signin?error=An unexpected error occurred', requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to sign-in page
  console.log('No code present, redirecting to sign-in page');
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
} 