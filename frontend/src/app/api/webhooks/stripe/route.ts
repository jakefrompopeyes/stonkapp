import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// This is your Stripe webhook secret for testing your endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error('Webhook secret is not set');
    }
    
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancellation(deletedSubscription);
      break;
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await handleSuccessfulPayment(invoice);
      }
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (failedInvoice.subscription) {
        await handleFailedPayment(failedInvoice);
      }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Helper functions to handle different subscription events

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;
  
  // Determine subscription tier based on price ID
  let tier = 'free';
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
    tier = 'premium';
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    tier = 'pro';
  }

  // Find the user by Stripe customer ID
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);

  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    
    // Update the user's subscription status
    await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_tier: tier,
      })
      .eq('id', userId);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find the user by Stripe customer ID
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);

  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    
    // Update the user's subscription status
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_tier: 'free',
      })
      .eq('id', userId);
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  // You could add additional logic here, like sending a receipt email
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find the user by Stripe customer ID
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);

  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    
    // Update the user's subscription status
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', userId);
    
    // You could also send an email notification about the failed payment
  }
} 