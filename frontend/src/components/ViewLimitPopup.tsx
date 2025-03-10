'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { 
  getRemainingViews, 
  getTotalViewLimit, 
  ANONYMOUS_VIEW_LIMIT, 
  AUTHENTICATED_VIEW_LIMIT,
  TOTAL_FREE_VIEWS,
  getAnonymousViews,
  getAuthenticatedViews
} from '@/lib/viewLimits';

interface ViewLimitPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewLimitPopup({ isOpen, onClose }: ViewLimitPopupProps) {
  const { user } = useAuth();
  const [remainingViews, setRemainingViews] = useState<number>(0);
  const [totalLimit, setTotalLimit] = useState<number>(0);
  const [nextReset, setNextReset] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const fetchViewLimits = async () => {
        try {
          // Get view information
          const remaining = await getRemainingViews(user?.id || null);
          const total = getTotalViewLimit(!!user);
          
          setRemainingViews(remaining);
          setTotalLimit(total);
          
          // Calculate next reset date (first day of next month)
          const today = new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const formatter = new Intl.DateTimeFormat('en-US', { 
            month: 'long', 
            day: 'numeric' 
          });
          setNextReset(formatter.format(nextMonth));
          
          // Debug information
          let debug = '';
          if (user) {
            const views = await getAuthenticatedViews(user.id);
            debug = `Authenticated user: ${user.id}\nViewed stocks: ${views.join(', ')}\nRemaining: ${remaining}/${total}`;
          } else {
            const views = getAnonymousViews();
            debug = `Anonymous user\nViewed stocks: ${Object.keys(views).join(', ')}\nRemaining: ${remaining}/${total}`;
          }
          setDebugInfo(debug);
          console.log('View limit debug:', debug);
        } catch (error) {
          console.error('Error fetching view limits:', error);
          setDebugInfo(`Error: ${error}`);
        }
      };
      
      fetchViewLimits();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Stock View Limit
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          {user ? (
            <>
              <p className="mb-4 text-gray-700">
                You've used all {AUTHENTICATED_VIEW_LIMIT} of your free stock profile views as a signed-in user.
              </p>
              <p className="text-gray-700 mb-4">
                Your view limit will reset on {nextReset}, or you can upgrade to a premium plan for unlimited views.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Link 
                  href="/pricing"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-center transition-colors"
                >
                  View Premium Plans
                </Link>
                <button 
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-center transition-colors"
                >
                  Wait for Reset
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-gray-700">
                You've used all {ANONYMOUS_VIEW_LIMIT} of your free anonymous stock profile views.
              </p>
              <p className="mb-4 text-gray-700">
                Sign up or sign in to get {AUTHENTICATED_VIEW_LIMIT} additional free views, or upgrade to a premium plan for unlimited access!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Link 
                  href="/auth/signin"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-center transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/pricing"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-center transition-colors"
                >
                  View Premium Plans
                </Link>
              </div>
            </>
          )}
        </div>
        
        <div className="text-sm text-gray-500 border-t pt-4">
          <p>
            {user 
              ? `You have used ${totalLimit - remainingViews}/${totalLimit} views as a signed-in user.`
              : `You have used ${ANONYMOUS_VIEW_LIMIT - remainingViews}/${ANONYMOUS_VIEW_LIMIT} anonymous views.`
            }
          </p>
          <p className="mt-2">
            {user 
              ? `Views reset on ${nextReset}. Premium plans available now!`
              : `Sign in to get ${TOTAL_FREE_VIEWS} total free views or upgrade for unlimited access.`
            }
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 