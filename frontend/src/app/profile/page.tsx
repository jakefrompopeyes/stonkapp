'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Simple authentication check
  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      if (!user) {
        console.log("No user found in profile page, redirecting to sign-in");
        router.push('/auth/signin');
      } else {
        console.log("User found in profile page:", user.email);
        setIsLoading(false);
      }
    }, 1000); // Short delay to ensure auth context is loaded

    return () => clearTimeout(timer);
  }, [user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we have a user, show the profile page
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Account ID</p>
            <p className="font-medium">{user?.id?.substring(0, 8)}...</p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Email Verified</p>
            <p className="font-medium">
              {user?.email_confirmed_at ? (
                <span className="text-green-600">Verified</span>
              ) : (
                <span className="text-red-600">Not verified</span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-gray-500 text-sm mb-1">Last Sign In</p>
            <p className="font-medium">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription</h2>
        <p>Your subscription information will appear here.</p>
      </div>
    </div>
  );
} 