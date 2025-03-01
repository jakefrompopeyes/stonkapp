'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<string>('Checking...');
  
  // Add logging on component mount and updates
  useEffect(() => {
    console.log('[PROFILE] Component mounted or updated');
    console.log('[PROFILE] Current user state:', user ? 'User exists' : 'No user');
    
    // Check session directly with Supabase
    const checkDirectSession = async () => {
      try {
        console.log('[PROFILE] Checking session directly with Supabase');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[PROFILE] Error checking direct session:', error);
          setSessionStatus('Error checking session');
          return;
        }
        
        if (data.session) {
          console.log('[PROFILE] Direct session check: Session found');
          console.log('[PROFILE] Session user:', data.session.user.email);
          setSessionStatus('Session found directly');
          
          // If we have a direct session but no user in context, refresh the user
          if (!user) {
            console.log('[PROFILE] Session exists but no user in context, refreshing user');
            await refreshUser();
          }
        } else {
          console.log('[PROFILE] Direct session check: No session found');
          setSessionStatus('No session found directly');
        }
      } catch (err) {
        console.error('[PROFILE] Error in direct session check:', err);
        setSessionStatus('Error in direct check');
      }
    };
    
    checkDirectSession();
    
    // Set a timeout to stop showing loading state even if auth is slow
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('[PROFILE] Forced loading state to end after timeout');
    }, 2000);
    
    // If we have user data, we can stop loading immediately
    if (user) {
      console.log('[PROFILE] User found, ending loading state');
      setIsLoading(false);
      clearTimeout(timer);
      
      console.log('[PROFILE] User ID:', user.id);
      console.log('[PROFILE] User email:', user.email);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [user, refreshUser]);

  // Handle adding a comment
  const handleAddComment = () => {
    if (comment.trim()) {
      console.log('[PROFILE] Adding comment:', comment);
      setComments([...comments, comment]);
      setComment('');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    console.log('[PROFILE] Sign out initiated');
    try {
      await signOut();
      console.log('[PROFILE] Sign out successful, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('[PROFILE] Sign out error:', error);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('[PROFILE] Manual refresh initiated');
    setIsLoading(true);
    try {
      await refreshUser();
      console.log('[PROFILE] Manual refresh completed');
    } catch (error) {
      console.error('[PROFILE] Manual refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    console.log('[PROFILE] Rendering loading state');
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user is found after loading completes, show auth required message
  if (!user) {
    console.log('[PROFILE] No user found after loading, showing auth required message');
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6">You need to be signed in to view this page.</p>
        <p className="mb-6 text-sm text-gray-600">Session status: {sessionStatus}</p>
        <div className="flex flex-col space-y-4 items-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Session
          </button>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  console.log('[PROFILE] Rendering profile page with user data');
  
  // Get user information
  const email = user?.email || 'No email available';
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const userId = user?.id || 'Unknown';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="mb-2"><span className="font-medium">Name:</span> {name}</p>
        <p className="mb-2"><span className="font-medium">Email:</span> {email}</p>
        <p className="mb-4"><span className="font-medium">Account ID:</span> {userId}</p>
        
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Session
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Debug Information */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6 overflow-auto max-h-60">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <p className="mb-2 text-sm">Session Status: {sessionStatus}</p>
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify({
            userId: user?.id,
            email: user?.email,
            aud: user?.aud,
            created_at: user?.created_at,
            last_sign_in_at: user?.last_sign_in_at,
            app_metadata: user?.app_metadata,
            user_metadata: user?.user_metadata,
          }, null, 2)}
        </pre>
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
    </div>
  );
} 