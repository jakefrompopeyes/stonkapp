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
    time: new Date().toISOString()
  });

  // Handle OAuth errors
  if (error) {
    console.error('[DEBUG] OAuth error:', error, error_description, new Date().toISOString());
    
    // If this is a popup window, we need to send a message to the parent window
    if (isPopup) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <script>
              console.log('[DEBUG] Auth callback error page loaded in popup', '${error}', '${error_description || ""}');
              
              function sendErrorToParent() {
                try {
                  if (window.opener) {
                    console.log('[DEBUG] Sending error message to parent window');
                    window.opener.postMessage({ 
                      type: 'auth-error', 
                      error: ${JSON.stringify(error_description || error)}
                    }, window.location.origin);
                    
                    // Close the popup after a short delay to ensure the message is sent
                    setTimeout(() => window.close(), 1000);
                  } else {
                    console.error('[DEBUG] No opener window found');
                    document.body.innerHTML += '<p>No opener window found. Please close this window manually.</p>';
                  }
                } catch (err) {
                  console.error('[DEBUG] Error sending message to parent:', err);
                  document.body.innerHTML += '<p>Error communicating with the main window. Please close this window manually.</p>';
                }
              }
              
              // Try to send the message when the page loads
              window.onload = sendErrorToParent;
              
              // Also try again after a short delay as a backup
              setTimeout(sendErrorToParent, 500);
            </script>
          </head>
          <body>
            <p>Authentication error: ${error_description || error}</p>
            <p>This window should close automatically. If it doesn't, you can close it manually.</p>
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
        
        // If this is a popup window, we need to send a message to the parent window
        if (isPopup) {
          return new Response(
            `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication Error</title>
                <script>
                  console.log('[DEBUG] Session exchange error in popup', '${error.message}');
                  
                  function sendErrorToParent() {
                    try {
                      if (window.opener) {
                        console.log('[DEBUG] Sending session exchange error to parent window');
                        window.opener.postMessage({ 
                          type: 'auth-error', 
                          error: ${JSON.stringify(error.message)}
                        }, window.location.origin);
                        
                        // Close the popup after a short delay to ensure the message is sent
                        setTimeout(() => window.close(), 1000);
                      } else {
                        console.error('[DEBUG] No opener window found');
                        document.body.innerHTML += '<p>No opener window found. Please close this window manually.</p>';
                      }
                    } catch (err) {
                      console.error('[DEBUG] Error sending message to parent:', err);
                      document.body.innerHTML += '<p>Error communicating with the main window. Please close this window manually.</p>';
                    }
                  }
                  
                  // Try to send the message when the page loads
                  window.onload = sendErrorToParent;
                  
                  // Also try again after a short delay as a backup
                  setTimeout(sendErrorToParent, 500);
                </script>
              </head>
              <body>
                <p>Authentication error: ${error.message}</p>
                <p>This window should close automatically. If it doesn't, you can close it manually.</p>
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
      
      console.log('[DEBUG] Session exchange successful', new Date().toISOString());
      
      // If this is a popup window, we need to send a message to the parent window
      if (isPopup) {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <script>
                console.log('[DEBUG] Auth successful in popup, sending success message');
                
                function sendSuccessToParent() {
                  try {
                    if (window.opener) {
                      console.log('[DEBUG] Sending success message to parent window');
                      window.opener.postMessage({ 
                        type: 'auth-success',
                        session: ${JSON.stringify(data.session)}
                      }, window.location.origin);
                      
                      // Close the popup after a short delay to ensure the message is sent
                      setTimeout(() => window.close(), 1000);
                    } else {
                      console.error('[DEBUG] No opener window found');
                      document.body.innerHTML += '<p>No opener window found. Please close this window manually.</p>';
                    }
                  } catch (err) {
                    console.error('[DEBUG] Error sending message to parent:', err);
                    document.body.innerHTML += '<p>Error communicating with the main window. Please close this window manually.</p>';
                  }
                }
                
                // Try to send the message when the page loads
                window.onload = sendSuccessToParent;
                
                // Also try again after a short delay as a backup
                setTimeout(sendSuccessToParent, 500);
              </script>
            </head>
            <body>
              <p>Authentication successful! This window should close automatically.</p>
              <p>If it doesn't close, you can close it manually and return to the application.</p>
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
      console.log('[DEBUG] Redirecting to profile page', new Date().toISOString());
      return NextResponse.redirect(new URL('/profile', requestUrl.origin));
    } catch (err) {
      console.error('[DEBUG] Unexpected error during authentication:', err, new Date().toISOString());
      
      // If this is a popup window, we need to send a message to the parent window
      if (isPopup) {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Error</title>
              <script>
                console.log('[DEBUG] Unexpected error in popup');
                
                function sendErrorToParent() {
                  try {
                    if (window.opener) {
                      console.log('[DEBUG] Sending unexpected error to parent window');
                      window.opener.postMessage({ 
                        type: 'auth-error', 
                        error: 'An unexpected error occurred during authentication'
                      }, window.location.origin);
                      
                      // Close the popup after a short delay to ensure the message is sent
                      setTimeout(() => window.close(), 1000);
                    } else {
                      console.error('[DEBUG] No opener window found');
                      document.body.innerHTML += '<p>No opener window found. Please close this window manually.</p>';
                    }
                  } catch (err) {
                    console.error('[DEBUG] Error sending message to parent:', err);
                    document.body.innerHTML += '<p>Error communicating with the main window. Please close this window manually.</p>';
                  }
                }
                
                // Try to send the message when the page loads
                window.onload = sendErrorToParent;
                
                // Also try again after a short delay as a backup
                setTimeout(sendErrorToParent, 500);
              </script>
            </head>
            <body>
              <p>An unexpected error occurred during authentication.</p>
              <p>This window should close automatically. If it doesn't, you can close it manually.</p>
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
        new URL('/auth/signin?error=An unexpected error occurred during authentication', requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to sign-in page
  console.log('[DEBUG] No code present, redirecting to sign-in page', new Date().toISOString());
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
} 