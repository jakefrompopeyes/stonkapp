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
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

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

    // Cancel the subscription at the end of the billing period
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update the subscription in the database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active', // Still active until the end of the period
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: {
        id: subscription.id,
        status: 'active',
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