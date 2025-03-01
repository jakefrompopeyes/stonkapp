'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  getRemainingViews, 
  getTotalViewLimit, 
  hasUnlimitedViews, 
  hasProSubscription,
  getUserViewLimit,
  getAuthenticatedViews, 
  AUTHENTICATED_VIEW_LIMIT, 
  ANONYMOUS_VIEW_LIMIT,
  PRO_VIEW_LIMIT
} from '@/lib/viewLimits';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ViewCounter() {
  const { user } = useAuth();
  const [remainingViews, setRemainingViews] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [nextReset, setNextReset] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [resetDate, setResetDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      try {
        // Check if user has unlimited views (premium)
        const unlimited = user ? await hasUnlimitedViews(user.id) : false;
        setIsUnlimited(unlimited);
        
        // Check if user has pro subscription
        const pro = user ? await hasProSubscription(user.id) : false;
        setIsPro(pro);
        
        // Get remaining views
        const remaining = await getRemainingViews(user?.id || null);
        
        // Get total view limit based on subscription
        const total = user ? await getUserViewLimit(user.id) : ANONYMOUS_VIEW_LIMIT;
        
        setRemainingViews(remaining);
        setTotalViews(total);
        
        // Calculate next reset date (first day of next month)
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const formatter = new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        setNextReset(formatter.format(nextMonth));
      } catch (error) {
        console.error('Error fetching view data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewData();
    
    // Refresh the view count every minute in case the user views stocks in another tab
    const intervalId = setInterval(fetchViewData, 60000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    async function fetchRemainingViews() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add a timeout to prevent UI blocking
        const timeoutPromise = new Promise<number>((resolve) => {
          // Default to showing max views if we time out
          setTimeout(() => {
            if (user) {
              resolve(AUTHENTICATED_VIEW_LIMIT);
            } else {
              resolve(ANONYMOUS_VIEW_LIMIT);
            }
          }, 3000);
        });
        
        // Race the actual view count fetch against the timeout
        const views = await Promise.race([
          getRemainingViews(user?.id || null),
          timeoutPromise
        ]);
        
        setRemainingViews(views);
        
        // Calculate reset date (first day of next month)
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        setResetDate(nextMonth.toLocaleDateString());
      } catch (err) {
        console.error('Error fetching remaining views:', err);
        setError('Could not load view count');
        // Default to showing max views if there's an error
        setRemainingViews(user ? AUTHENTICATED_VIEW_LIMIT : ANONYMOUS_VIEW_LIMIT);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRemainingViews();
  }, [user]);

  if (loading || remainingViews === null) {
    return null; // Don't show anything while loading
  }

  // If user has unlimited views, show a special display
  if (isUnlimited) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Stock Views</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              Unlimited
            </span>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
              style={{ width: '100%' }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-500 mt-1 text-right">
            Premium subscription active
          </div>
        </div>
      </div>
    );
  }

  // If user has pro subscription, show a pro display
  if (isPro) {
    // Calculate percentage for the progress bar and used views
    const usedViews = totalViews - remainingViews;
    const percentage = Math.max(0, Math.min(100, (usedViews / PRO_VIEW_LIMIT) * 100));

    return (
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Stock Views</span>
            <span className="text-sm text-gray-500 ml-4">
              {usedViews} / {PRO_VIEW_LIMIT} used
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            {/* Reset date */}
            <div className="text-xs text-gray-500">
              Resets on {nextReset}
            </div>
            
            {/* Upgrade button */}
            <Link 
              href="/pricing" 
              className="text-xs text-blue-600 font-medium hover:text-blue-800"
            >
              Upgrade to Premium →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentage for the progress bar and used views
  const usedViews = totalViews - remainingViews;
  // The percentage should be based on used views, not remaining views
  const percentage = Math.max(0, Math.min(100, (usedViews / totalViews) * 100));

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-1">
        <span>Loading view limit...</span>
      </div>
    );
  }

  // If there was an error, show a simplified view
  if (error) {
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-1">
        <span>Free stock views available</span>
        <Link href="/pricing" className="text-xs text-blue-500 hover:underline ml-2">
          Upgrade →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Stock Views</span>
          <span className="text-sm text-gray-500 ml-4">
            {usedViews} / {totalViews} used
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
          <div 
            className="h-full bg-yellow-500 transition-all duration-500 ease-in-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          {/* Reset date */}
          <div className="text-xs text-gray-500">
            Resets on {nextReset}
          </div>
          
          {/* Upgrade button */}
          <Link 
            href="/pricing" 
            className="text-xs text-blue-600 font-medium hover:text-blue-800"
          >
            Upgrade →
          </Link>
        </div>
      </div>
    </div>
  );
} 