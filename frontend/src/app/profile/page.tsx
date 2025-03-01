'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  // Handle adding a comment
  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment('');
    }
  };

  // Simple loading state while we wait for auth to initialize
  if (user === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          onClick={() => {
            signOut();
            router.push('/');
          }}
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
    </div>
  );
} 