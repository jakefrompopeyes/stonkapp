import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Check if required environment variables are available
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Stripe if key is available
const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

// Initialize Supabase admin client if keys are available
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request: NextRequest) {
  // Check if required services are initialized
  if (!stripe || !supabaseAdmin) {
    console.error('Missing required environment variables for subscription cancellation');
    return NextResponse.json(
      { error: 'Service configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  try {
    // Get the request body
    const body = await request.json();
    const { subscriptionId, customerId } = body;

    // We need either a subscription ID or a customer ID
    if (!subscriptionId && !customerId) {
      return NextResponse.json(
        { error: 'Either Subscription ID or Customer ID is required' },
        { status: 400 }
      );
    }

    let stripeSubscriptionId: string;

    if (subscriptionId) {
      // Get the subscription from the database
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError || !subscription) {
        console.error('Error fetching subscription:', fetchError);
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }

      // Check if the subscription has a Stripe subscription ID
      if (!subscription.stripe_subscription_id) {
        return NextResponse.json(
          { error: 'No Stripe subscription found' },
          { status: 400 }
        );
      }

      stripeSubscriptionId = subscription.stripe_subscription_id;
    } else {
      // Find the active subscription for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (!subscriptions || subscriptions.data.length === 0) {
        return NextResponse.json(
          { error: 'No active subscription found for this customer' },
          { status: 404 }
        );
      }

      stripeSubscriptionId = subscriptions.data[0].id;
    }

    // Cancel the subscription at the end of the billing period
    const stripeSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update the user's profile in the database
    if (customerId) {
      // Find the user by Stripe customer ID
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        
        // Update the user's subscription status to indicate it will be canceled
        await supabaseAdmin
          .from('profiles')
          .update({
            cancel_at_period_end: true,
          })
          .eq('id', userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: true,
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 