import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import Membership from '@/models/Membership';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import Invitation from '@/models/Invitation';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';
import getStripe from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Only the workspace OWNER can permanently delete the workspace
    const context = await requireTenantAccess(['OWNER']);
    const body = await request.json();
    const { workspaceNameConfirm } = body;

    await dbConnect();

    const tenant = await Tenant.findById(context.tenant.id);
    if (!tenant) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    // Verify exact workspace name matches confirmation input (case-insensitive & trimmed)
    if (
      !workspaceNameConfirm ||
      workspaceNameConfirm.trim().toLowerCase() !== tenant.name.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Workspace name confirmation does not match.' },
        { status: 400 }
      );
    }

    const tenantId = tenant._id;

    // 1. Handle Stripe Subscription Cancellation if active
    const subscription = await Subscription.findOne({ tenantId });
    if (subscription?.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        console.log(`[Stripe Subscription Cancel] Successfully canceled subscription: ${subscription.stripeSubscriptionId}`);
      } catch (stripeErr) {
        console.error('[Stripe Cancel Error] Failed to cancel stripe subscription during workspace delete.', stripeErr);
      }
    }

    // 2. Perform safe cascading deletions for this workspace/tenant only
    await Promise.all([
      Project.deleteMany({ tenantId }),
      Task.deleteMany({ tenantId }),
      Comment.deleteMany({ tenantId }),
      Notification.deleteMany({ tenantId }),
      Invitation.deleteMany({ tenantId }),
      Membership.deleteMany({ tenantId }),
      Subscription.deleteMany({ tenantId }),
      Payment.deleteMany({ tenantId }),
      Tenant.deleteOne({ _id: tenantId }),
    ]);

    console.log(`[Workspace Deleted] Permanently purged workspace: ${tenant.name} (${tenantId})`);

    // 3. Clear active tenant context cookie to trigger redirect/reload
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'activeTenantId',
      value: '',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Workspace permanently deleted.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied. Only the Workspace Owner can permanently delete this workspace.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
