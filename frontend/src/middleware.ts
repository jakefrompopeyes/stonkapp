import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Log the request URL for debugging
  console.log(`Middleware processing request for: ${req.nextUrl.pathname}`);
  
  // Create a response to modify
  const res = NextResponse.next();
  
  // Create a Supabase client configured for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name);
          if (cookie) {
            console.log(`Found cookie ${name} in request`);
          }
          return cookie?.value;
        },
        set(name: string, value: string, options: any) {
          console.log(`Setting cookie ${name} in response`);
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          console.log(`Removing cookie ${name} from response`);
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
    // Refresh the session if it exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If accessing a protected route and no session, redirect to login
    if (req.nextUrl.pathname.startsWith('/profile') && !session) {
      console.log('No session found, redirecting to sign-in');
      
      // Create the redirect URL with the original URL as a redirect parameter
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      
      return NextResponse.redirect(redirectUrl);
    }

    // If we have a session, add user info to request headers for debugging
    if (session) {
      console.log('Session found for user:', session.user.email);
      
      // Add user info to headers for server components
      res.headers.set('x-user-email', session.user.email || '');
      res.headers.set('x-user-id', session.user.id || '');
      res.headers.set('x-user-role', session.user.role || 'authenticated');
    }
  } catch (error) {
    console.error('Error in middleware:', error);
  }

  // For all other routes, continue
  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 