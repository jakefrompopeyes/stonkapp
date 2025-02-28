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

  // Calculate percentage for the progress bar
  const percentage = Math.max(0, Math.min(100, (remainingViews / totalViews) * 100));
  
  // Determine color based on remaining views
  const getColorClass = () => {
    if (percentage > 66) return 'bg-green-500';
    if (percentage > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col items-end">
      <div className="bg-white shadow rounded-lg p-3 w-64">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Stock Views</span>
          <span className="text-sm text-gray-500">
            {remainingViews} / {totalViews} remaining
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColorClass()} transition-all duration-500 ease-in-out`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {user && nextReset && (
          <div className="mt-2 text-xs text-gray-500 text-right">
            Resets on {nextReset}
          </div>
        )}
      </div>
    </div>
  );
} 