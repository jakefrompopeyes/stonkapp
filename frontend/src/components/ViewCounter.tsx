'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getRemainingViews, getTotalViewLimit, hasUnlimitedViews } from '@/lib/viewLimits';

export default function ViewCounter() {
  const { user } = useAuth();
  const [remainingViews, setRemainingViews] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [nextReset, setNextReset] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      try {
        // Check if user has unlimited views
        const unlimited = user ? await hasUnlimitedViews(user.id) : false;
        setIsUnlimited(unlimited);
        
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

  // Calculate percentage for the progress bar and used views
  const usedViews = totalViews - remainingViews;
  const percentage = Math.max(0, Math.min(100, (remainingViews / totalViews) * 100));

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
        
        {/* Reset date */}
        <div className="text-xs text-gray-500 mt-1 text-right">
          Resets on {nextReset}
        </div>
      </div>
    </div>
  );
} 