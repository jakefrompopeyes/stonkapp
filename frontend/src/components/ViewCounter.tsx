'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getRemainingViews, getTotalViewLimit } from '@/lib/viewLimits';

export default function ViewCounter() {
  const { user } = useAuth();
  const [remainingViews, setRemainingViews] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [nextReset, setNextReset] = useState<string>('');

  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      try {
        const remaining = await getRemainingViews(user?.id || null);
        const total = getTotalViewLimit(!!user);
        
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

  if (loading || remainingViews === null) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="flex items-center text-sm">
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-1 text-blue-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
          />
        </svg>
        <span className="font-medium">
          {remainingViews} / {totalViews} views
          {user && nextReset && (
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              (resets {nextReset})
            </span>
          )}
        </span>
      </div>
    </div>
  );
} 