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
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

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
          // Log all available user information for debugging
          const typedUser = auth.user as User;
          const userInfo = {
            id: typedUser.id,
            email: typedUser.email,
            app_metadata: typedUser.app_metadata,
            user_metadata: typedUser.user_metadata,
            identities: typedUser.identities,
            provider: typedUser.app_metadata?.provider
          };
          
          addDebugLog(`User found in context: ${JSON.stringify(userInfo, null, 2)}`);
          
          // Get user identifier - could be email or name from Google auth
          const userIdentifier = getUserIdentifier(typedUser);
          addDebugLog(`User identifier: ${userIdentifier}`);
          
          setIsLoading(false);
          return;
        }
        
        // If no user, try to refresh
        addDebugLog("No user in context, trying to refresh");
        await auth.refreshUser();
        
        // Check again after refresh
        if (auth.user) {
          // Log all available user information for debugging
          const typedUser = auth.user as User;
          const userInfo = {
            id: typedUser.id,
            email: typedUser.email,
            app_metadata: typedUser.app_metadata,
            user_metadata: typedUser.user_metadata,
            identities: typedUser.identities,
            provider: typedUser.app_metadata?.provider
          };
          
          addDebugLog(`User found after refresh: ${JSON.stringify(userInfo, null, 2)}`);
          
          // Get user identifier - could be email or name from Google auth
          const userIdentifier = getUserIdentifier(typedUser);
          addDebugLog(`User identifier after refresh: ${userIdentifier}`);
          
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

  // Helper function to get user identifier from different auth providers
  const getUserIdentifier = (user: User): string => {
    // Try email first (works for email auth)
    if (user.email) {
      return user.email;
    }
    
    // Try user_metadata for Google auth
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    if (user.user_metadata?.email) {
      return user.user_metadata.email;
    }
    
    // Try identities for OAuth providers
    if (user.identities && user.identities.length > 0) {
      const googleIdentity = user.identities.find(identity => 
        identity.provider === 'google'
      );
      
      if (googleIdentity?.identity_data) {
        return googleIdentity.identity_data.email || 
               googleIdentity.identity_data.name || 
               'Google User';
      }
    }
    
    // Fallback to user ID
    return user.id.substring(0, 8) + '...';
  };

  // Handle comment submission
  const handleCommentSubmit = () => {
    if (comment.trim()) {
      setComments(prev => [...prev, comment]);
      setComment('');
      console.log('Comment submitted:', comment);
    }
  };

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
  const userIdentifier = getUserIdentifier(user);

  // If we have a user, show the profile page
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Email/Username</p>
            <p className="font-medium">{userIdentifier}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Account ID</p>
            <p className="font-medium">{user.id ? `${user.id.substring(0, 8)}...` : 'Not available'}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Authentication Provider</p>
            <p className="font-medium">
              {user.app_metadata?.provider || 
               (user.identities && user.identities[0]?.provider) || 
               'Email'}
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
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Subscription</h2>
        <p>Your subscription information will appear here.</p>
      </div>
      
      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        
        {/* Comment Input */}
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
          <button
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleCommentSubmit}
          >
            Post Comment
          </button>
        </div>
        
        {/* Comments List */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((text, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-800">{text}</p>
                <p className="text-xs text-gray-500 mt-1">Posted just now</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          )}
        </div>
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