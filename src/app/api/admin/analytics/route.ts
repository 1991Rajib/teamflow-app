import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';

export async function GET() {
  try {
    // 1. Verify platform admin role
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // 2. Aggregate monthly trend data (last 6 months)
    const trend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [newWorkspaces, cumulativeWorkspaces, newUsers, cumulativeUsers] = await Promise.all([
        Tenant.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
        Tenant.countDocuments({ createdAt: { $lte: monthEnd } }),
        User.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
        User.countDocuments({ createdAt: { $lte: monthEnd } }),
      ]);

      const label = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' });

      trend.push({
        label,
        newWorkspaces,
        cumulativeWorkspaces,
        newUsers,
        cumulativeUsers,
      });
    }

    // 3. Plan distributions
    const [freeCount, proCount] = await Promise.all([
      Subscription.countDocuments({ status: { $in: ['ACTIVE', 'TRIALING'] }, stripeSubscriptionId: { $exists: false } }),
      Subscription.countDocuments({ status: { $in: ['ACTIVE', 'TRIALING'] }, stripeSubscriptionId: { $exists: true } }),
    ]);

    // Include workspaces without subscription record in free plan count
    const totalWorkspaces = await Tenant.countDocuments();
    const actualFreeCount = Math.max(freeCount, totalWorkspaces - proCount);

    const plansDistribution = [
      { name: 'Free Plan', value: actualFreeCount },
      { name: 'Pro Plan', value: proCount },
    ];

    // 4. Subscription statuses distribution
    const statuses = ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE'] as const;
    const subscriptionStatuses = [];

    for (const stat of statuses) {
      const count = await Subscription.countDocuments({ status: stat });
      subscriptionStatuses.push({ name: stat, value: count });
    }

    return NextResponse.json({
      trend,
      plansDistribution,
      subscriptionStatuses,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_ANALYTICS_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
