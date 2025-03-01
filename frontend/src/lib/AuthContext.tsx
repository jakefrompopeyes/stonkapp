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
      console.log('[DEBUG] Initiating Google OAuth sign-in with direct redirect...', new Date().toISOString());
      
      // Get the current URL origin for proper redirect
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log('[DEBUG] Using redirect URL:', redirectUrl);
      
      // Use direct redirect instead of a popup window
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Important: Do NOT add any additional query parameters to the redirectTo URL
          queryParams: {
            // Show account selection screen every time
            prompt: 'select_account',
            // Ensure we get a fresh authentication
            access_type: 'offline',
            // Include email scope explicitly
            scope: 'email profile',
          },
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
      
      console.log('[DEBUG] OAuth URL received, redirecting to Google authentication...', data.url, new Date().toISOString());
      
      // Instead of opening a popup, we'll redirect the current page
      // No setTimeout here - direct redirect is more reliable
      window.location.href = data.url;
      
      // Return a promise that resolves after a timeout
      // This is just to keep the UI in loading state until the redirect happens
      return new Promise((resolve) => {
        setTimeout(resolve, 5000);
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