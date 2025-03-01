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
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        console.log("[AUTH DEBUG] Getting initial session...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AUTH DEBUG] Initial session result:", session ? "Found" : "None", session?.user?.email);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          console.log("[AUTH DEBUG] User authenticated:", session.user.email);
        } else {
          console.log("[AUTH DEBUG] No session found during initialization");
        }
      } catch (error) {
        console.error('[AUTH DEBUG] Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AUTH DEBUG] Auth state change event:", event);
        console.log("[AUTH DEBUG] New session:", session ? "Found" : "None", session?.user?.email);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          console.log("[AUTH DEBUG] User authenticated after state change:", session.user.email);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          console.log("[AUTH DEBUG] User signed out after state change");
        }
        
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
      setIsLoading(true);
      console.log("[AUTH DEBUG] Signing in user:", email);
      
      // Use signInWithPassword with explicit session persistence
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error("[AUTH DEBUG] Sign in error:", error);
        throw error;
      }
      
      // Explicitly set the user and session after successful sign-in
      if (data && data.user) {
        setUser(data.user);
        setSession(data.session);
        setIsAuthenticated(true);
        console.log("[AUTH DEBUG] User signed in successfully:", data.user.email);
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("[AUTH DEBUG] Signing up user:", email);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("[AUTH DEBUG] Sign up error:", error);
        throw error;
      }
      console.log("[AUTH DEBUG] User signed up successfully");
    } catch (error) {
      console.error('[AUTH DEBUG] Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[AUTH DEBUG] Initiating Google OAuth sign-in...');
      
      // Get the current URL origin for proper redirect
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log('[AUTH DEBUG] Using redirect URL:', redirectUrl);
      
      // Use direct redirect instead of a popup window
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            scope: 'email profile',
          },
        },
      });
      
      if (error) {
        console.error('[AUTH DEBUG] Error initiating Google OAuth:', error);
        throw error;
      }
      
      if (!data.url) {
        console.error('[AUTH DEBUG] No OAuth URL returned from Supabase');
        throw new Error('Failed to get authentication URL');
      }
      
      console.log('[AUTH DEBUG] OAuth URL received, redirecting to Google authentication...');
      
      // Instead of opening a popup, we'll redirect the current page
      window.location.href = data.url;
      
      // Return a promise that resolves after a timeout
      return new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    } catch (error) {
      console.error('[AUTH DEBUG] Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("[AUTH DEBUG] Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AUTH DEBUG] Sign out error:", error);
        throw error;
      }
      console.log("[AUTH DEBUG] User signed out successfully");
    } catch (error) {
      console.error('[AUTH DEBUG] Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH DEBUG] Refreshing user data");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("[AUTH DEBUG] Session found during refresh:", session.user.email);
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        console.log("[AUTH DEBUG] No session found during refresh");
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Error refreshing user data:', error);
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
    isAuthenticated,
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