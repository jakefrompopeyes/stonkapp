import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log(`[MIDDLEWARE] Processing: ${req.nextUrl.pathname}`);
  console.log(`[MIDDLEWARE] Request URL: ${req.url}`);
  
  // List all cookies for debugging
  const allCookies = req.cookies.getAll();
  console.log(`[MIDDLEWARE] All cookies:`, allCookies.map(c => c.name).join(', '));
  
  // Check for Supabase auth cookies specifically
  const hasAuthCookie = req.cookies.has('sb-access-token') || 
                       req.cookies.has('sb-refresh-token') || 
                       req.cookies.has('supabase-auth-token');
  
  console.log(`[MIDDLEWARE] Has auth cookies: ${hasAuthCookie}`);
  
  // Skip middleware for non-profile routes
  if (!req.nextUrl.pathname.startsWith('/profile')) {
    console.log(`[MIDDLEWARE] Not a protected route, skipping auth check`);
    return NextResponse.next();
  }
  
  console.log(`[MIDDLEWARE] Protected route detected, checking authentication`);
  
  // Check if we're in a redirect loop
  const redirectCount = parseInt(req.headers.get('x-redirect-count') || '0');
  if (redirectCount > 2) {
    console.log(`[MIDDLEWARE] Redirect loop detected (count: ${redirectCount}), allowing access to prevent loop`);
    return NextResponse.next();
  }
  
  // If we have auth cookies, we can bypass the full check to prevent issues
  if (hasAuthCookie) {
    console.log(`[MIDDLEWARE] Auth cookies found, bypassing full session check`);
    return NextResponse.next();
  }
  
  // Create a response to modify
  const res = NextResponse.next();
  
  try {
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

    console.log(`[MIDDLEWARE] Attempting to get session from Supabase`);
    
    // Get the session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error(`[MIDDLEWARE] Error getting session:`, error);
      
      // Create a redirect response with an incremented redirect count
      const redirectUrl = new URL('/auth/signin', req.url);
      // Add the 'from' parameter to indicate where the redirect came from
      redirectUrl.searchParams.set('from', req.nextUrl.pathname);
      
      const redirectRes = NextResponse.redirect(redirectUrl);
      redirectRes.headers.set('x-redirect-count', (redirectCount + 1).toString());
      
      return redirectRes;
    }
    
    console.log(`[MIDDLEWARE] Session check result: ${data.session ? 'Session found' : 'No session'}`);
    
    // If no session, redirect to login
    if (!data.session) {
      console.log(`[MIDDLEWARE] No session found, redirecting to sign-in`);
      
      // Create a redirect response with an incremented redirect count
      const redirectUrl = new URL('/auth/signin', req.url);
      // Add the 'from' parameter to indicate where the redirect came from
      redirectUrl.searchParams.set('from', req.nextUrl.pathname);
      console.log(`[MIDDLEWARE] Redirect URL: ${redirectUrl.toString()}`);
      
      const redirectRes = NextResponse.redirect(redirectUrl);
      redirectRes.headers.set('x-redirect-count', (redirectCount + 1).toString());
      
      return redirectRes;
    }
    
    // User is authenticated, allow access
    console.log(`[MIDDLEWARE] Session found for user: ${data.session.user.email}`);
    console.log(`[MIDDLEWARE] User ID: ${data.session.user.id}`);
    console.log(`[MIDDLEWARE] Allowing access to protected route`);
    
    return res;
  } catch (error) {
    console.error(`[MIDDLEWARE] Unexpected error in middleware:`, error);
    
    // If we have auth cookies but got an error, still allow access to prevent issues
    if (hasAuthCookie) {
      console.log(`[MIDDLEWARE] Auth cookies found despite error, allowing access`);
      return NextResponse.next();
    }
    
    // On error, redirect to sign-in as a fallback, with redirect count
    const redirectUrl = new URL('/auth/signin', req.url);
    // Add the 'from' parameter to indicate where the redirect came from
    redirectUrl.searchParams.set('from', req.nextUrl.pathname);
    const redirectRes = NextResponse.redirect(redirectUrl);
    redirectRes.headers.set('x-redirect-count', (redirectCount + 1).toString());
    
    return redirectRes;
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 