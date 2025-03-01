'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

// Define the subscription plans
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Basic access to stock information',
    features: [
      '3 stock views per month',
      'Basic stock information',
      'Price history charts',
    ],
    buttonText: 'Current Plan',
    disabled: true,
    priceId: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    description: 'Enhanced access to stock data',
    features: [
      '25 stock views per month',
      'Advanced financial metrics',
      'Insider trading data',
      'Company financials',
      'Email alerts for price changes',
    ],
    buttonText: 'Subscribe',
    disabled: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    description: 'Professional-grade stock analysis',
    features: [
      'Unlimited stock views',
      'All Pro features',
      'Real-time stock data',
      'Advanced technical indicators',
      'Portfolio tracking',
      'API access',
      'Priority support',
    ],
    buttonText: 'Subscribe',
    disabled: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Redirect to sign in page if not logged in
      router.push('/auth/signin?redirect=/pricing');
      return;
    }

    setLoading(true);
    setSelectedPlan(priceId);

    try {
      // Create a subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to checkout page
      router.push(`/checkout?session_id=${data.subscriptionId}&client_secret=${data.clientSecret}`);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get unlimited access to stock data and advanced features with our premium plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden border ${
              plan.popular ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="bg-blue-500 text-white text-center py-2 font-medium">
                Most Popular
              </div>
            )}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {plan.name}
              </h2>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                )}
              </div>
              <p className="text-gray-600 mb-6">
                {plan.description}
              </p>
              <ul className="mb-8 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg 
                      className="w-5 h-5 text-green-500 mr-2" 
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
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !plan.disabled && handleSubscribe(plan.priceId)}
                disabled={plan.disabled || loading || selectedPlan === plan.priceId}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  plan.disabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-900 text-white'
                }`}
              >
                {loading && selectedPlan === plan.priceId ? (
                  <span className="flex items-center justify-center">
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          {user ? (
            'Need help choosing a plan? Contact our support team.'
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
              {' '}to manage your subscription.
            </>
          )}
        </p>
      </div>
    </div>
  );
} 