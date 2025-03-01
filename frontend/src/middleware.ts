import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
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

  // Refresh the session if it exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If accessing the profile page and no session, redirect to login
  if (req.nextUrl.pathname.startsWith('/profile') && !session) {
    console.log('No session found, redirecting to sign-in');
    const redirectUrl = new URL('/auth/signin', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If we have a session, add user info to request headers for debugging
  if (session) {
    console.log('Session found for user:', session.user.email);
  }

  // For all other routes, continue
  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 