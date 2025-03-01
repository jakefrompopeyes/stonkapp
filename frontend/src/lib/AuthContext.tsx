'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session, Provider } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // Function to update auth state
  const updateAuthState = (newSession: Session | null) => {
    console.log('[AUTH] Updating auth state:', newSession ? 'Session exists' : 'No session');
    
    if (newSession) {
      console.log('[AUTH] User ID:', newSession.user.id);
      if (newSession.expires_at) {
        console.log('[AUTH] Session expires at:', new Date(newSession.expires_at * 1000).toISOString());
      }
    }
    
    setSession(newSession);
    setUser(newSession?.user || null);
    setIsAuthenticated(!!newSession);
    setIsLoading(false);
    
    console.log('[AUTH] Auth state updated. User:', newSession?.user ? 'exists' : 'null');
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        console.log("[AUTH] Getting initial session...");
        
        // Check for cookies
        const allCookies = document.cookie;
        console.log("[AUTH] Cookies present:", allCookies ? 'Yes' : 'No');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AUTH] Error getting initial session:", error);
          updateAuthState(null);
          return;
        }
        
        console.log("[AUTH] Initial session result:", session ? "Found" : "None");
        if (session) {
          console.log("[AUTH] Session user email:", session.user.email);
          if (session.expires_at) {
            console.log("[AUTH] Session expires at:", new Date(session.expires_at * 1000).toISOString());
          }
        }
        
        updateAuthState(session);
      } catch (error) {
        console.error('[AUTH] Error getting initial session:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AUTH] Auth state change event:", event);
        console.log("[AUTH] New session:", session ? "Found" : "None");
        
        if (session) {
          console.log("[AUTH] Session user email:", session.user.email);
          if (session.expires_at) {
            console.log("[AUTH] Session expires at:", new Date(session.expires_at * 1000).toISOString());
          }
        }
        
        updateAuthState(session);
        
        // Only redirect on explicit sign-in/sign-out actions, not on initial load or refresh
        if (event === 'SIGNED_IN' && window.location.pathname.includes('/auth/')) {
          console.log("[AUTH] User signed in from auth page, redirecting to home");
          router.push('/');
        } else if (event === 'SIGNED_OUT') {
          console.log("[AUTH] User signed out, redirecting to home");
          router.push('/');
        }
      }
    );

    // Cleanup subscription
    return () => {
      console.log("[AUTH] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Signing in user:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("[AUTH] Sign in error:", error);
        throw error;
      }
      
      console.log("[AUTH] Sign in successful:", data.user?.email);
      return;
    } catch (error) {
      console.error("[AUTH] Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Signing up user:", email);
      
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error("[AUTH] Sign up error:", error);
        throw error;
      }
      
      console.log("[AUTH] Sign up successful:", data.user?.email);
    } catch (error) {
      console.error("[AUTH] Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Signing in with Google");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error("[AUTH] Google sign in error:", error);
        throw error;
      }
      
      console.log("[AUTH] Google sign in initiated, redirect URL:", data.url);
      return data;
    } catch (error) {
      console.error("[AUTH] Google sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Signing out user");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[AUTH] Sign out error:", error);
        throw error;
      }
      
      console.log("[AUTH] Sign out successful");
    } catch (error) {
      console.error("[AUTH] Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      console.log("[AUTH] Refreshing user session");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AUTH] Error refreshing session:", error);
        updateAuthState(null);
        return;
      }
      
      if (session) {
        console.log("[AUTH] Session refreshed successfully for user:", session.user.email);
        updateAuthState(session);
      } else {
        console.log("[AUTH] No session found during refresh");
        updateAuthState(null);
      }
    } catch (error) {
      console.error("[AUTH] Error refreshing user:", error);
      updateAuthState(null);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 