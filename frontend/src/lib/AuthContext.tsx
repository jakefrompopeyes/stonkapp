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
      
      // Use direct redirect instead of a popup window
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?t=${Date.now()}`, // Add timestamp to prevent caching
          // Don't skip browser redirect - we want a full page redirect
          queryParams: {
            // Force consent screen to show every time and use select_account to allow user to choose account
            prompt: 'consent select_account',
            // Ensure we get a fresh authentication
            access_type: 'offline',
            // Include email scope explicitly
            scope: 'email profile',
            // Add additional parameters to prevent caching issues
            include_granted_scopes: 'true',
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
      
      // Add a small delay before redirecting to ensure logs are sent
      setTimeout(() => {
        // Instead of opening a popup, we'll redirect the current page
        window.location.href = data.url;
        console.log('[DEBUG] Redirect initiated', new Date().toISOString());
      }, 100);
      
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