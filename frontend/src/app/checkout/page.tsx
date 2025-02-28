'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { useAuth } from '@/lib/AuthContext';
import CheckoutForm from '@/components/CheckoutForm';

// Create a client component that uses useSearchParams
function CheckoutContent() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/auth/signin?redirect=/pricing');
      return;
    }
    
    // Get the client secret and subscription ID from the URL
    const secret = searchParams.get('client_secret');
    const sessionId = searchParams.get('session_id');
    
    if (!secret || !sessionId) {
      setError('Invalid checkout session. Please try again.');
      setLoading(false);
      return;
    }
    
    setClientSecret(secret);
    setSubscriptionId(sessionId);
    setLoading(false);
  }, [user, router, searchParams]);
  
  // Handle successful payment
  const handlePaymentSuccess = () => {
    // Redirect to success page
    router.push('/checkout/success');
  };
  
  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Loading checkout...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Checkout Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Complete Your Subscription
      </h1>
      
      {clientSecret && (
        <Elements stripe={getStripe()} options={{ clientSecret }}>
          <CheckoutForm 
            clientSecret={clientSecret} 
            subscriptionId={subscriptionId || ''} 
            onSuccess={handlePaymentSuccess}
          />
        </Elements>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function CheckoutLoading() {
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
      <p className="text-center mt-4 text-gray-600">Loading checkout...</p>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
} 