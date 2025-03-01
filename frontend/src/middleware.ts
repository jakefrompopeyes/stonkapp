import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log(`Middleware processing: ${req.nextUrl.pathname}`);
  
  // Only protect profile routes
  if (!req.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.next();
  }
  
  // Create a response to modify
  const res = NextResponse.next();
  
  // Create a Supabase client configured for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
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
    // Get the session
    const { data } = await supabase.auth.getSession();
    
    // If no session, redirect to login
    if (!data.session) {
      console.log('No session found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // User is authenticated, allow access
    console.log('Session found for user:', data.session.user.email);
    return res;
  } catch (error) {
    console.error('Error in middleware:', error);
    // On error, redirect to sign-in as a fallback
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 