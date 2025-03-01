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

  // Simplified authentication check
  useEffect(() => {
    // Prevent multiple auth checks
    if (authCheckAttempted.current) return;
    
    const checkAuth = async () => {
      authCheckAttempted.current = true;
      addDebugLog("Profile page mounted");
      
      try {
        // First check if we already have a user in context
        if (auth.user) {
          addDebugLog(`User found in context: ${JSON.stringify(auth.user)}`);
          setIsLoading(false);
          return;
        }
        
        // If no user, try to refresh once
        addDebugLog("No user in context, trying to refresh");
        await auth.refreshUser();
        
        // Check again after refresh
        if (auth.user) {
          addDebugLog(`User found after refresh: ${JSON.stringify(auth.user)}`);
          setIsLoading(false);
        } else {
          // Let middleware handle the redirect
          addDebugLog("No user found after refresh");
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
    if (user.user_metadata && user.user_metadata.full_name) {
      return user.user_metadata.full_name;
    }
    
    // Fallback to user ID
    return user.id;
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we have a user, show the profile
  if (auth.user) {
    // Cast the user to the correct type
    const user = auth.user as unknown as User;
    
    // Get a display name for the user
    const userIdentifier = user.email || 
                          (user.user_metadata?.full_name as string) || 
                          user.id;
    
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <p className="mb-2"><span className="font-medium">Email/Username:</span> {userIdentifier}</p>
          <p className="mb-2"><span className="font-medium">Account ID:</span> {user.id}</p>
          <p className="mb-4"><span className="font-medium">Last Sign In:</span> {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
          
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="Add a comment..."
            ></textarea>
            <button
              onClick={handleAddComment}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Comment
            </button>
          </div>
          
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  {c}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No comments yet. Be the first to add one!</p>
          )}
        </div>
        
        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mt-8 overflow-auto max-h-96">
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs">
              {debugInfo.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unauthenticated users (should be handled by middleware)
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
      <p className="mb-6">You need to be signed in to view this page.</p>
      <button
        onClick={() => router.push('/auth/signin')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go to Sign In
      </button>
    </div>
  );
} 