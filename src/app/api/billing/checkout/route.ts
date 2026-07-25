import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import { getTenantSubscription } from '@/lib/subscription';
import getStripe from '@/lib/stripe';
import Subscription from '@/models/Subscription';

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for upgrading the tenant workspace to Pro.
 * OWNER-only: only the workspace owner can initiate billing changes.
 */
export async function POST() {
  try {
    // Only the workspace OWNER can initiate billing changes
    const context = await requireTenantAccess(['OWNER']);

    await dbConnect();

    const { subscription, planCode } = await getTenantSubscription(context.tenant.id);

    // Prevent double-checkout for already-upgraded workspaces
    if (planCode === 'PRO') {
      return NextResponse.json(
        { error: 'ALREADY_PRO', message: 'This workspace is already on the Pro plan.' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_PRO_PRICE_ID) {
      throw new Error('STRIPE_PRO_PRICE_ID environment variable is not defined.');
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not defined.');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const stripe = getStripe();
    let stripeCustomerId = subscription?.stripeCustomerId;

    // Create or reuse Stripe customer record
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: context.user.email,
        name: context.tenant.name,
        metadata: {
          tenantId: context.tenant.id,
          userId: context.user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Persist the stripeCustomerId immediately so future sessions reuse it
      if (subscription) {
        await Subscription.findOneAndUpdate(
          { tenantId: context.tenant.id },
          { stripeCustomerId },
          { new: true }
        );
      }
    }

    // Create a Stripe Checkout session (hosted payment page)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        tenantId: context.tenant.id,
      },
      success_url: `${appUrl}/billing?session=success`,
      cancel_url: `${appUrl}/billing?session=canceled`,
    });

    return NextResponse.json({ status: 'success', url: session.url });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only the workspace owner can manage billing.' },
        { status: 403 }
      );
    }
    console.error('[billing/checkout] Error:', err.message);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
