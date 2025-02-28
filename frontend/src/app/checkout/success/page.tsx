'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function SuccessPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Refresh user data to get updated subscription status
    refreshUser();
  }, [user, router, refreshUser]);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <svg 
            className="h-10 w-10 text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for your subscription. Your account has been upgraded and you now have access to all premium features.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/stock/AAPL"
            className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Explore Stocks
          </Link>
          
          <Link 
            href="/profile"
            className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Account
          </Link>
        </div>
      </div>
    </div>
  );
} 