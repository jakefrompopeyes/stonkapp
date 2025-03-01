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
      console.log('[DEBUG] Initiating Google OAuth sign-in...', new Date().toISOString());
      
      // Get the current URL origin for proper redirect
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log('[DEBUG] Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Force consent screen to show every time
            prompt: 'consent',
            // Request offline access to get refresh token
            access_type: 'offline',
            // Include email scope explicitly
            scope: 'email profile',
            // Add a parameter to help with Vercel's edge functions
            hd: 'domain.com', // Optional: restrict to specific domain
          },
          // Skip browser redirect in client - we'll handle it manually
          skipBrowserRedirect: true,
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
      
      console.log('[DEBUG] OAuth URL received:', data.url.substring(0, 100) + '...', new Date().toISOString());
      
      // Store a timestamp in localStorage to detect freezes
      if (typeof window !== 'undefined') {
        localStorage.setItem('google_auth_started', Date.now().toString());
      }
      
      // Redirect to the OAuth URL
      if (typeof window !== 'undefined') {
        window.location.href = data.url;
      }
      
      // Return the data for any further processing
      return data;
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