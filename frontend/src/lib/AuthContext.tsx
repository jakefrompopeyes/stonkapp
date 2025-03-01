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
      console.log('Initiating Google OAuth sign-in with popup window...');
      
      // Use a popup window instead of a redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?popup=true`,
          skipBrowserRedirect: true, // Don't redirect the current page, we'll handle the popup ourselves
        },
      });
      
      if (error) {
        console.error('Error initiating Google OAuth:', error);
        throw error;
      }
      
      if (!data.url) {
        console.error('No OAuth URL returned from Supabase');
        throw new Error('Failed to get authentication URL');
      }
      
      console.log('Opening popup window for Google authentication...');
      
      // Open the authentication URL in a popup window
      const width = 600;
      const height = 600;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        console.error('Popup blocked by browser');
        throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
      }
      
      // Create a promise that will resolve when the popup completes
      return new Promise((resolve, reject) => {
        // Set a timeout to detect if the process is hanging
        const timeoutId = setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error('Google sign-in timed out after 60 seconds'));
        }, 60000);
        
        // Add a message event listener to handle messages from the popup
        const messageHandler = (event: MessageEvent) => {
          // Verify the origin of the message
          if (event.origin !== window.location.origin) return;
          
          // Handle auth success message
          if (event.data?.type === 'auth-success') {
            console.log('Received auth-success message from popup');
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
            console.error('Received auth-error message from popup:', event.data.error);
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
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            
            // Check if the user is authenticated after popup closes
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                console.log('Successfully authenticated with Google');
                resolve({ provider: 'google', url: data.url });
              } else {
                console.log('Popup closed without completing authentication');
                reject(new Error('Authentication was cancelled or failed'));
              }
            });
          }
        }, 500);
        
        // Also listen for auth state changes as a backup
        const authListener = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            console.log('Auth state changed: SIGNED_IN');
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(pollPopup);
            clearTimeout(timeoutId);
            authListener.data.subscription.unsubscribe();
            resolve({ provider: 'google', url: data.url });
          }
        });
      });
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
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