'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // If not loading and no user, redirect to sign in
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we have a user, show the profile page
  if (user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm mb-1">Account ID</p>
              <p className="font-medium">{user.id.substring(0, 8)}...</p>
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
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-gray-500 text-sm">Receive email updates about your account</p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input type="checkbox" id="toggle" className="sr-only" />
                <label
                  htmlFor="toggle"
                  className="block bg-gray-300 w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"
                >
                  <span
                    className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-gray-500 text-sm">Switch between light and dark theme</p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input type="checkbox" id="dark-mode" className="sr-only" />
                <label
                  htmlFor="dark-mode"
                  className="block bg-gray-300 w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"
                >
                  <span
                    className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"
                  ></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached due to the redirect, but just in case
  return null;
} 