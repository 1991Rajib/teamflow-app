import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import Tenant from '@/models/Tenant';
import Membership from '@/models/Membership';

export async function GET(request: Request) {
  try {
    // 1. Verify platform admin role
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

    await dbConnect();

    // 2. Count documents
    const totalCount = await Subscription.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // 3. Retrieve paginated subscription list
    const subscriptionDocs = await Subscription.find()
      .populate('tenantId', 'name status')
      .populate('planId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // 4. Resolve owner info and format results
    const subscriptions = [];
    for (const sub of subscriptionDocs) {
      const tenant = sub.tenantId as any;
      if (!tenant) continue;

      // Find Owner
      const ownerMembership = await Membership.findOne({
        tenantId: tenant._id,
        role: 'OWNER',
      }).populate('userId', 'name email');

      const ownerUser = ownerMembership?.userId as any;
      const owner = ownerUser
        ? { id: ownerUser._id.toString(), name: ownerUser.name, email: ownerUser.email }
        : { id: '', name: 'Unknown', email: 'Unknown' };

      const plan = sub.planId as any;

      subscriptions.push({
        id: sub._id.toString(),
        workspace: {
          id: tenant._id.toString(),
          name: tenant.name,
          status: tenant.status || 'ACTIVE',
        },
        owner,
        plan: {
          name: plan?.name || 'FREE',
          code: plan?.code || 'FREE',
          price: plan?.price || 0,
          currency: plan?.currency || 'USD',
          billingInterval: plan?.billingInterval || 'NONE',
        },
        status: sub.status,
        stripeCustomerId: sub.stripeCustomerId || null,
        stripeSubscriptionId: sub.stripeSubscriptionId || null,
        currentPeriodStart: sub.currentPeriodStart || null,
        currentPeriodEnd: sub.currentPeriodEnd || null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: sub.createdAt,
      });
    }

    return NextResponse.json({
      subscriptions,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_SUBSCRIPTIONS_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
