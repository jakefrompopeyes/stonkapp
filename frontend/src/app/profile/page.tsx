'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { hasProSubscription, hasUnlimitedViews } from '@/lib/viewLimits';

export default function ProfilePage() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<string>('Checking...');
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    status: string;
    tier: string;
    isActive: boolean;
    willCancel?: boolean;
  }>({ status: 'none', tier: 'free', isActive: false });
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Add logging on component mount and updates
  useEffect(() => {
    console.log('[PROFILE] Component mounted or updated');
    console.log('[PROFILE] Current user state:', user ? 'User exists' : 'No user');
    
    // Check session directly with Supabase
    const checkDirectSession = async () => {
      try {
        console.log('[PROFILE] Checking session directly with Supabase');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[PROFILE] Error checking direct session:', error);
          setSessionStatus('Error checking session');
          return;
        }
        
        if (data.session) {
          console.log('[PROFILE] Direct session check: Session found');
          console.log('[PROFILE] Session user:', data.session.user.email);
          setSessionStatus('Session found directly');
          
          // If we have a direct session but no user in context, refresh the user
          if (!user) {
            console.log('[PROFILE] Session exists but no user in context, refreshing user');
            await refreshUser();
          }
        } else {
          console.log('[PROFILE] Direct session check: No session found');
          setSessionStatus('No session found directly');
        }
      } catch (err) {
        console.error('[PROFILE] Error in direct session check:', err);
        setSessionStatus('Error in direct check');
      }
    };
    
    checkDirectSession();
    
    // Set a timeout to stop showing loading state even if auth is slow
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('[PROFILE] Forced loading state to end after timeout');
    }, 2000);
    
    // If we have user data, we can stop loading immediately
    if (user) {
      console.log('[PROFILE] User found, ending loading state');
      setIsLoading(false);
      clearTimeout(timer);
      
      console.log('[PROFILE] User ID:', user.id);
      console.log('[PROFILE] User email:', user.email);
    }
    
    // Check subscription status
    const checkSubscription = async () => {
      if (user?.id) {
        const hasPro = await hasProSubscription(user.id);
        const hasPremium = await hasUnlimitedViews(user.id);
        
        // Get user profile to get subscription details
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_tier, stripe_customer_id, cancel_at_period_end')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setSubscriptionInfo({
            status: profile.subscription_status || 'none',
            tier: profile.subscription_tier || 'free',
            isActive: profile.subscription_status === 'active',
            willCancel: profile.cancel_at_period_end || false
          });
        }
      }
    };
    
    checkSubscription();
    
    return () => {
      clearTimeout(timer);
    };
  }, [user, refreshUser]);

  // Handle sign out
  const handleSignOut = async () => {
    console.log('[PROFILE] Sign out initiated');
    try {
      await signOut();
      console.log('[PROFILE] Sign out successful, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('[PROFILE] Sign out error:', error);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('[PROFILE] Manual refresh initiated');
    setIsLoading(true);
    try {
      await refreshUser();
      console.log('[PROFILE] Manual refresh completed');
    } catch (error) {
      console.error('[PROFILE] Manual refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    
    setCancelLoading(true);
    
    try {
      // Get user profile to get subscription details
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.stripe_customer_id) {
        throw new Error('No subscription found');
      }
      
      // Call the cancel API with the user's stripe customer ID
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update local state
      setSubscriptionInfo(prev => ({
        ...prev,
        status: 'active', // Still active until the end of the period
        isActive: true,
        willCancel: true
      }));
      
      alert('Your subscription will be canceled at the end of the current billing period.');
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    console.log('[PROFILE] Rendering loading state');
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user is found after loading completes, show auth required message
  if (!user) {
    console.log('[PROFILE] No user found after loading, showing auth required message');
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6">You need to be signed in to view this page.</p>
        <p className="mb-6 text-sm text-gray-600">Session status: {sessionStatus}</p>
        <div className="flex flex-col space-y-4 items-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Session
          </button>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  console.log('[PROFILE] Rendering profile page with user data');
  
  // Get user information
  const email = user?.email || 'No email available';
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const userId = user?.id || 'Unknown';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="mb-2"><span className="font-medium">Name:</span> {name}</p>
        <p className="mb-2"><span className="font-medium">Email:</span> {email}</p>
        <p className="mb-4"><span className="font-medium">Account ID:</span> {userId}</p>
        
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Session
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Subscription Information */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Information</h2>
        
        <p className="mb-2">
          <span className="font-medium">Current Plan:</span>{' '}
          {subscriptionInfo.tier === 'premium' 
            ? 'Premium' 
            : subscriptionInfo.tier === 'pro' 
              ? 'Pro' 
              : 'Free'}
        </p>
        
        <p className="mb-4">
          <span className="font-medium">Status:</span>{' '}
          {subscriptionInfo.status === 'active' 
            ? subscriptionInfo.willCancel
              ? 'Active (Cancels at end of billing period)'
              : 'Active' 
            : subscriptionInfo.status === 'canceled' 
              ? 'Canceled' 
              : subscriptionInfo.status === 'past_due' 
                ? 'Past Due' 
                : 'None'}
        </p>
        
        {subscriptionInfo.isActive && !subscriptionInfo.willCancel && (subscriptionInfo.tier === 'premium' || subscriptionInfo.tier === 'pro') && (
          <div>
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Your subscription will remain active until the end of the current billing period.
            </p>
          </div>
        )}
        
        {subscriptionInfo.isActive && subscriptionInfo.willCancel && (
          <div>
            <p className="text-yellow-600 font-medium mb-2">
              Your subscription will be canceled at the end of the current billing period.
            </p>
            <p className="text-sm text-gray-500">
              You'll still have access to all premium features until then.
            </p>
          </div>
        )}
        
        {!subscriptionInfo.isActive && (
          <div>
            <p className="mb-2">Upgrade your plan to access more features!</p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 