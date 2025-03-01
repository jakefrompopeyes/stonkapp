import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key if available
let stripe: Stripe | null = null;

// Only initialize Stripe if the API key is available
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  });
}

export async function POST(request: Request) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('Stripe API key is not configured');
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 500 }
      );
    }

    const { amount, currency = 'usd', paymentMethodType = 'card' } = await request.json();

    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: [paymentMethodType],
      metadata: {
        company: 'StonkApp',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
} 