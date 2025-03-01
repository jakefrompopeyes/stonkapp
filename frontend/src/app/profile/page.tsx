'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';

export default function ProfilePage() {
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const authCheckAttempted = useRef(false);

  // Add debug log function
  const addDebugLog = (message: string) => {
    console.log(`[PROFILE DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, message]);
  };

  // Enhanced authentication check
  useEffect(() => {
    // Prevent multiple auth checks
    if (authCheckAttempted.current) return;
    
    const checkAuth = async () => {
      authCheckAttempted.current = true;
      addDebugLog("Profile page mounted");
      
      try {
        // First check if we already have a user in context
        if (auth.user) {
          const userEmail = (auth.user as User).email || 'unknown';
          addDebugLog(`User found in context: ${userEmail}`);
          setIsLoading(false);
          return;
        }
        
        // If no user, try to refresh
        addDebugLog("No user in context, trying to refresh");
        await auth.refreshUser();
        
        // Check again after refresh
        if (auth.user) {
          const userEmail = (auth.user as User).email || 'unknown';
          addDebugLog(`User found after refresh: ${userEmail}`);
          setIsLoading(false);
        } else {
          // Only redirect if we're sure there's no user
          addDebugLog("No user found after refresh, but won't redirect (middleware should handle this)");
          setIsLoading(false);
        }
      } catch (error) {
        addDebugLog(`Error checking authentication: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [auth]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Loading Profile...</h1>
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        
        {/* Debug information */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <pre className="text-xs overflow-auto max-h-40">
            {debugInfo.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  // If we don't have a user after loading, show an error
  if (!auth.user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Authentication Error</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>You are not authenticated. Please sign in to view your profile.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Sign In
          </button>
        </div>
        
        {/* Debug information */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <pre className="text-xs overflow-auto max-h-40">
            {debugInfo.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  // Get the user with proper typing
  const user = auth.user as User;

  // If we have a user, show the profile page
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Email</p>
            <p className="font-medium">{user.email || 'Not available'}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Account ID</p>
            <p className="font-medium">{user.id ? `${user.id.substring(0, 8)}...` : 'Not available'}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Email Verified</p>
            <p className="font-medium">
              {user.email_confirmed_at ? (
                <span className="text-green-600">Verified</span>
              ) : (
                <span className="text-red-600">Not verified</span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Sign In</p>
            <p className="font-medium">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription</h2>
        <p>Your subscription information will appear here.</p>
      </div>
      
      {/* Debug information */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <pre className="text-xs overflow-auto max-h-40">
          {debugInfo.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </pre>
      </div>
    </div>
  );
} 