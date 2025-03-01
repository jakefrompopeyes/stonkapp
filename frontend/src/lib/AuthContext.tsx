'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session, Provider } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ provider: Provider; url: string } | unknown>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[DEBUG] Initiating Google OAuth sign-in with popup window...', new Date().toISOString());
      
      // Use a popup window instead of a redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?popup=true&t=${Date.now()}`, // Add timestamp to prevent caching
          skipBrowserRedirect: true, // Don't redirect the current page, we'll handle the popup ourselves
        },
      });
      
      if (error) {
        console.error('[DEBUG] Error initiating Google OAuth:', error);
        throw error;
      }
      
      if (!data.url) {
        console.error('[DEBUG] No OAuth URL returned from Supabase');
        throw new Error('Failed to get authentication URL');
      }
      
      console.log('[DEBUG] OAuth URL received:', data.url);
      console.log('[DEBUG] Opening popup window for Google authentication...', new Date().toISOString());
      
      // Open the authentication URL in a popup window
      const width = 600;
      const height = 700; // Increased height to ensure consent screen is fully visible
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        console.error('[DEBUG] Popup blocked by browser');
        throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
      }
      
      // Try to focus the popup to ensure it's in the foreground
      popup.focus();
      
      // Create a promise that will resolve when the popup completes
      return new Promise((resolve, reject) => {
        // Set a timeout to detect if the process is hanging
        const timeoutId = setTimeout(() => {
          console.error('[DEBUG] Google sign-in timed out after 60 seconds', new Date().toISOString());
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error('Google sign-in timed out after 60 seconds. Please try again.'));
        }, 60000);
        
        // Add a message event listener to handle messages from the popup
        const messageHandler = (event: MessageEvent) => {
          // Verify the origin of the message
          console.log('[DEBUG] Received message from popup:', event.origin, event.data, new Date().toISOString());
          
          if (event.origin !== window.location.origin) {
            console.log('[DEBUG] Ignoring message from different origin:', event.origin);
            return;
          }
          
          // Handle auth success message
          if (event.data?.type === 'auth-success') {
            console.log('[DEBUG] Received auth-success message from popup', new Date().toISOString());
            window.removeEventListener('message', messageHandler);
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            resolve({ provider: 'google', url: data.url });
          }
          
          // Handle auth error message
          if (event.data?.type === 'auth-error') {
            console.error('[DEBUG] Received auth-error message from popup:', event.data.error, new Date().toISOString());
            window.removeEventListener('message', messageHandler);
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Poll the popup to check if it's been closed
        const pollPopup = setInterval(() => {
          if (!popup || popup.closed) {
            console.log('[DEBUG] Popup closed', new Date().toISOString());
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageHandler);
            
            // Check if the user is authenticated after popup closes
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                console.log('[DEBUG] Successfully authenticated with Google after popup closed', new Date().toISOString());
                resolve({ provider: 'google', url: data.url });
              } else {
                console.log('[DEBUG] Popup closed without completing authentication', new Date().toISOString());
                reject(new Error('Authentication was cancelled or failed'));
              }
            });
          }
        }, 500);
        
        // Also listen for auth state changes as a backup
        const authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[DEBUG] Auth state changed:', event, new Date().toISOString());
          if (event === 'SIGNED_IN' && session) {
            console.log('[DEBUG] Auth state changed: SIGNED_IN', new Date().toISOString());
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageHandler);
            authListener.data.subscription.unsubscribe();
            resolve({ provider: 'google', url: data.url });
          }
        });
      });
    } catch (error) {
      console.error('[DEBUG] Error in signInWithGoogle:', error, new Date().toISOString());
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 