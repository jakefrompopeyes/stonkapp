'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Separate useEffect for authentication check to avoid redirect flashing
  useEffect(() => {
    // Only redirect if we're on the client, not loading, and there's no user
    if (isClient && !isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router, isClient]);

  // Fetch user's subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        setIsLoadingSubscription(true);
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error fetching subscription:', error);
        }
        
        setSubscription(data || null);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setIsLoadingSubscription(false);
      }
    };
    
    fetchSubscription();
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    try {
      setIsCancelling(true);
      setError(null);
      
      // Call your subscription cancellation API
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      // Update local state
      setSubscription({
        ...subscription,
        status: 'canceled',
        cancel_at_period_end: true,
      });
      
      setSuccess('Your subscription has been canceled. You will have access until the end of your billing period.');
      setShowCancelConfirm(false);
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message || 'Failed to cancel subscription. Please try again later.');
    } finally {
      setIsCancelling(false);
    }
  };

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
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              className="float-right font-bold"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
            <button 
              className="float-right font-bold"
              onClick={() => setSuccess(null)}
            >
              &times;
            </button>
          </div>
        )}
        
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
        
        {/* Subscription Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          
          {isLoadingSubscription ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : subscription ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Plan</p>
                  <p className="font-medium">{subscription.plan_name || 'Premium'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 text-sm mb-1">Status</p>
                  <p className="font-medium">
                    {subscription.status === 'active' ? (
                      <span className="text-green-600">Active</span>
                    ) : subscription.status === 'canceled' ? (
                      <span className="text-yellow-600">Canceled</span>
                    ) : (
                      <span className="text-red-600">{subscription.status}</span>
                    )}
                  </p>
                </div>
                
                {subscription.current_period_end && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">
                      {subscription.cancel_at_period_end ? 'Access Until' : 'Next Billing Date'}
                    </p>
                    <p className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <div>
                  {showCancelConfirm ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="mb-4">Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.</p>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {isCancelling ? 'Canceling...' : 'Yes, Cancel Subscription'}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          No, Keep Subscription
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-4">You don't have an active subscription.</p>
              <a 
                href="/pricing" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
              >
                View Premium Plans
              </a>
            </div>
          )}
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