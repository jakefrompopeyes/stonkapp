'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function AuthDebug() {
  const { user, session, isLoading, signInWithGoogle, signOut } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-md text-xs"
      >
        Show Auth Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full overflow-auto max-h-[80vh] text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Auth Debug Panel</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Auth Status</h4>
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Authenticated: {user ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {user && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">User Info</h4>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Provider: {user.app_metadata?.provider || 'N/A'}</p>
            <p>Created: {new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (error) {
                console.error('Google sign-in error:', error);
              }
            }}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Sign in with Google
          </button>

          {user && (
            <button
              onClick={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error('Sign out error:', error);
                }
              }}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {session && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Session Info</h4>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            <p>Expires: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            <details>
              <summary className="cursor-pointer">Access Token</summary>
              <p className="text-xs break-all mt-1">{session.access_token}</p>
            </details>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        This panel is for debugging purposes only.
      </div>
    </div>
  );
} 