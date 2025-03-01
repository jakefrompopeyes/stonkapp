import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log(`Middleware processing: ${req.nextUrl.pathname}`);
  
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
    
    // If accessing a protected route and no session, redirect to login
    if (req.nextUrl.pathname.startsWith('/profile') && !data.session) {
      console.log('No session found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    if (data.session) {
      console.log('Session found for user:', data.session.user.email);
    }
  } catch (error) {
    console.error('Error in middleware:', error);
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/profile/:path*'],
}; 