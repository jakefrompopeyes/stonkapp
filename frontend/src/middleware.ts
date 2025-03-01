import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log(`[MIDDLEWARE] Processing: ${req.nextUrl.pathname}`);
  console.log(`[MIDDLEWARE] Request URL: ${req.url}`);
  console.log(`[MIDDLEWARE] Cookies present: ${req.cookies.size > 0 ? 'Yes' : 'No'}`);
  
  // Only protect profile routes
  if (!req.nextUrl.pathname.startsWith('/profile')) {
    console.log(`[MIDDLEWARE] Not a profile route, skipping auth check`);
    return NextResponse.next();
  }
  
  console.log(`[MIDDLEWARE] Profile route detected, checking authentication`);
  
  // Create a response to modify
  const res = NextResponse.next();
  
  // Create a Supabase client configured for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name)?.value;
          console.log(`[MIDDLEWARE] Getting cookie: ${name}, exists: ${!!cookie}`);
          return cookie;
        },
        set(name: string, value: string, options: any) {
          console.log(`[MIDDLEWARE] Setting cookie: ${name}`);
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          console.log(`[MIDDLEWARE] Removing cookie: ${name}`);
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    console.log(`[MIDDLEWARE] Attempting to get session from Supabase`);
    // Get the session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error(`[MIDDLEWARE] Error getting session:`, error);
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    console.log(`[MIDDLEWARE] Session check result: ${data.session ? 'Session found' : 'No session'}`);
    
    // If no session, redirect to login
    if (!data.session) {
      console.log(`[MIDDLEWARE] No session found, redirecting to sign-in`);
      const redirectUrl = new URL('/auth/signin', req.url);
      console.log(`[MIDDLEWARE] Redirect URL: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl);
    }
    
    // User is authenticated, allow access
    console.log(`[MIDDLEWARE] Session found for user: ${data.session.user.email}`);
    console.log(`[MIDDLEWARE] User ID: ${data.session.user.id}`);
    console.log(`[MIDDLEWARE] Session expires at: ${new Date(data.session.expires_at! * 1000).toISOString()}`);
    console.log(`[MIDDLEWARE] Allowing access to profile page`);
    return res;
  } catch (error) {
    console.error(`[MIDDLEWARE] Unexpected error in middleware:`, error);
    // On error, redirect to sign-in as a fallback
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 