import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function POST(request: Request) {
  try {
    const { priceId, userId, customerId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If we don't have a customer ID, create a new customer
    let stripeCustomerId = customerId;
    if (!stripeCustomerId) {
      // Get user profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', userId)
        .single();

      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: profile?.email || undefined,
        name: profile?.name || undefined,
        metadata: {
          userId,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Update the user profile with the Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Get the client secret from the payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error creating subscription' },
      { status: 500 }
    );
  }
} 