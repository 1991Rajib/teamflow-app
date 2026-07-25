import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import getStripe from '@/lib/stripe';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';
import { getFreePlanDoc, getProPlanDoc } from '@/lib/subscription';
import Stripe from 'stripe';

/**
 * POST /api/billing/webhook
 * Handles incoming Stripe webhook events.
 *
 * IMPORTANT: This route must use raw body (not parsed JSON) for Stripe signature verification.
 * It uses `request.arrayBuffer()` to get the raw bytes before Stripe verification.
 */
export const runtime = 'nodejs';
// Disable body parsing — Stripe requires the raw, unparsed body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.arrayBuffer();
  const rawBody = Buffer.from(body);

  const headersList = await headers();
  const stripeSignature = headersList.get('stripe-signature');

  if (!stripeSignature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not defined');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  // Verify the webhook signature to prevent replay attacks / forged events
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook] Signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  await dbConnect();

  try {
    switch (event.type) {
      // ── CHECKOUT COMPLETED → Activate Pro Subscription ────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;

        if (!tenantId) {
          console.error('[webhook] checkout.session.completed: Missing tenantId in metadata');
          break;
        }

        const proPlan = await getProPlanDoc();
        if (!proPlan) {
          console.error('[webhook] checkout.session.completed: PRO plan not found in database');
          break;
        }

        // Retrieve the full subscription from Stripe to get period dates
        let stripeSub: Stripe.Subscription | null = null;
        if (session.subscription) {
          stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
        }

        await Subscription.findOneAndUpdate(
          { tenantId },
          {
            planId: proPlan._id,
            status: 'ACTIVE',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            currentPeriodStart: stripeSub
              ? new Date(stripeSub.items.data[0].current_period_start * 1000)
              : undefined,
            currentPeriodEnd: stripeSub
              ? new Date(stripeSub.items.data[0].current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: false,
          },
          { upsert: false, new: true }
        );

        const { logPlatformActivity } = require('@/lib/audit');
        await logPlatformActivity({
          activityType: 'SUBSCRIPTION_UPGRADED',
          description: `Workspace upgraded to Pro subscription via Stripe checkout.`,
          targetTenantId: tenantId,
        });

        console.log(`[webhook] ✅ Tenant ${tenantId} upgraded to PRO`);
        break;
      }

      // ── SUBSCRIPTION UPDATED → Sync period dates and status ───────────────
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const tenantSubscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSub.id,
        });

        if (!tenantSubscription) {
          console.warn('[webhook] customer.subscription.updated: No matching subscription found');
          break;
        }

        const subscriptionItem = stripeSub.items.data[0];

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSub.id },
          {
            status: mapStripeStatus(stripeSub.status),
            currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
            currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          }
        );

        console.log(`[webhook] ✅ Subscription ${stripeSub.id} updated`);
        break;
      }

      // ── SUBSCRIPTION DELETED → Revert to Free Plan ────────────────────────
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;

        const freePlan = await getFreePlanDoc();
        if (!freePlan) {
          console.error('[webhook] customer.subscription.deleted: FREE plan not found');
          break;
        }

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSub.id },
          {
            planId: freePlan._id,
            status: 'CANCELED',
            stripeSubscriptionId: undefined,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: undefined,
            currentPeriodStart: undefined,
          }
        );

        const { logPlatformActivity } = require('@/lib/audit');
        const tenantSubscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSub.id,
        });
        if (tenantSubscription) {
          await logPlatformActivity({
            activityType: 'SUBSCRIPTION_CANCELED',
            description: `Workspace Pro subscription canceled and downgraded to Free plan.`,
            targetTenantId: tenantSubscription.tenantId.toString(),
          });
        }

        console.log(`[webhook] ✅ Subscription ${stripeSub.id} canceled — reverted to FREE`);
        break;
      }

      // ── INVOICE SUCCEEDED → Record Payment ────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Look up the tenant via stripeCustomerId
        const tenantSubscription = await Subscription.findOne({
          stripeCustomerId: invoice.customer as string,
        });

        if (!tenantSubscription) {
          console.warn('[webhook] invoice.payment_succeeded: No matching tenant subscription');
          break;
        }

        // Avoid duplicate payment records
        const existingPayment = await Payment.findOne({
          providerPaymentId: invoice.id,
        });

        if (!existingPayment) {
          await Payment.create({
            tenantId: tenantSubscription.tenantId,
            subscriptionId: tenantSubscription._id,
            amount: (invoice.amount_paid ?? 0) / 100, // Stripe amounts are in cents
            currency: invoice.currency?.toUpperCase() ?? 'USD',
            status: 'SUCCEEDED',
            provider: 'STRIPE',
            providerPaymentId: invoice.id,
          });
          console.log(`[webhook] ✅ Payment recorded for invoice ${invoice.id}`);
        }
        break;
      }

      // ── INVOICE FAILED → Mark subscription as PAST_DUE ───────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        await Subscription.findOneAndUpdate(
          { stripeCustomerId: invoice.customer as string },
          { status: 'PAST_DUE' }
        );

        console.log(`[webhook] ⚠️ Payment failed for customer ${invoice.customer}`);
        break;
      }

      default:
        // Acknowledge and ignore unhandled events
        break;
    }
  } catch (handlerError) {
    const msg = handlerError instanceof Error ? handlerError.message : 'Unknown error';
    console.error(`[webhook] Handler error for event ${event.type}:`, msg);
    // Return 200 even on handler errors to prevent Stripe from retrying
    return NextResponse.json({ received: true, warning: msg });
  }

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type StripeSubStatus = Stripe.Subscription['status'];
type OurSubStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

function mapStripeStatus(stripeStatus: StripeSubStatus): OurSubStatus {
  const map: Record<StripeSubStatus, OurSubStatus> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
    paused: 'ACTIVE',
  };
  return map[stripeStatus] ?? 'ACTIVE';
}
