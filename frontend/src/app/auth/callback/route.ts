import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const isPopup = requestUrl.searchParams.get('popup') === 'true';

  console.log('Auth callback received:', { 
    hasCode: !!code, 
    error, 
    error_description,
    url: request.url,
    isPopup
  });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    
    // If this is a popup window, we need to send a message to the parent window
    if (isPopup) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.onload = function() {
                window.opener.postMessage({ 
                  type: 'auth-error', 
                  error: ${JSON.stringify(error_description || error)}
                }, window.location.origin);
                window.close();
              }
            </script>
          </head>
          <body>
            <p>Authentication error. This window should close automatically.</p>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }
    
    // For regular redirects, go back to the sign-in page with the error
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
        
        // If this is a popup window, we need to send a message to the parent window
        if (isPopup) {
          return new Response(
            `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication Error</title>
                <script>
                  window.onload = function() {
                    window.opener.postMessage({ 
                      type: 'auth-error', 
                      error: ${JSON.stringify(error.message)}
                    }, window.location.origin);
                    window.close();
                  }
                </script>
              </head>
              <body>
                <p>Authentication error. This window should close automatically.</p>
              </body>
            </html>
            `,
            {
              headers: {
                'Content-Type': 'text/html',
              },
            }
          );
        }
        
        // For regular redirects, go back to the sign-in page with the error
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
      
      console.log('Session exchange successful');
      
      // If this is a popup window, we need to send a message to the parent window
      if (isPopup) {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <script>
                window.onload = function() {
                  window.opener.postMessage({ 
                    type: 'auth-success',
                    session: ${JSON.stringify(data.session)}
                  }, window.location.origin);
                  window.close();
                }
              </script>
            </head>
            <body>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
          `,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
      }
      
      // For regular redirects, go to the profile page
      console.log('Redirecting to profile page');
      return NextResponse.redirect(new URL('/profile', requestUrl.origin));
    } catch (err) {
      console.error('Unexpected error during authentication:', err);
      
      // If this is a popup window, we need to send a message to the parent window
      if (isPopup) {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Error</title>
              <script>
                window.onload = function() {
                  window.opener.postMessage({ 
                    type: 'auth-error', 
                    error: 'An unexpected error occurred'
                  }, window.location.origin);
                  window.close();
                }
              </script>
            </head>
            <body>
              <p>Authentication error. This window should close automatically.</p>
            </body>
          </html>
          `,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
      }
      
      // For regular redirects, go back to the sign-in page with a generic error
      return NextResponse.redirect(
        new URL('/auth/signin?error=An unexpected error occurred', requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to sign-in page
  console.log('No code present, redirecting to sign-in page');
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
} 