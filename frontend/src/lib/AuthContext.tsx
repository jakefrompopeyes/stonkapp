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
    setSession(newSession);
    setUser(newSession?.user || null);
    setIsAuthenticated(!!newSession);
    setIsLoading(false);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        console.log("[AUTH DEBUG] Getting initial session...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AUTH DEBUG] Initial session result:", session ? "Found" : "None", session?.user?.email);
        
        updateAuthState(session);
      } catch (error) {
        console.error('[AUTH DEBUG] Error getting initial session:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AUTH DEBUG] Auth state change event:", event);
        console.log("[AUTH DEBUG] New session:", session ? "Found" : "None", session?.user?.email);
        
        updateAuthState(session);
        
        // Handle redirects on sign in/out
        if (event === 'SIGNED_IN') {
          console.log("User already signed in, redirecting to home");
          router.push('/');
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to home");
          router.push('/');
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("[AUTH DEBUG] Signing in user:", email);
      
      await supabase.auth.signInWithPassword({ email, password });
    } catch (error) {
      console.error("[AUTH DEBUG] Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("[AUTH DEBUG] Signing up user:", email);
      
      await supabase.auth.signUp({ email, password });
    } catch (error) {
      console.error("[AUTH DEBUG] Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH DEBUG] Signing in with Google");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[AUTH DEBUG] Google sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH DEBUG] Signing out user");
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[AUTH DEBUG] Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      console.log("[AUTH DEBUG] Refreshing user session");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("[AUTH DEBUG] Session refreshed successfully");
        updateAuthState(session);
      } else {
        console.log("[AUTH DEBUG] No session found during refresh");
        updateAuthState(null);
      }
    } catch (error) {
      console.error("[AUTH DEBUG] Error refreshing user:", error);
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