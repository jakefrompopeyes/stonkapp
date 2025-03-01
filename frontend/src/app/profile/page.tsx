'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);
  
  // Add logging on component mount and updates
  useEffect(() => {
    console.log('[PROFILE] Component mounted or updated');
    console.log('[PROFILE] Current user state:', user ? 'User exists' : 'No user');
    if (user) {
      console.log('[PROFILE] User ID:', user.id);
      console.log('[PROFILE] User email:', user.email);
      console.log('[PROFILE] User metadata:', JSON.stringify(user.user_metadata));
    }
  }, [user]);

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

  // Simple loading state while we wait for auth to initialize
  if (user === null) {
    console.log('[PROFILE] Rendering loading state (user is null)');
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {/* Debug Information */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6 overflow-auto max-h-60">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
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