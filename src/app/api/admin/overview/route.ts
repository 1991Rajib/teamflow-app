import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Parallel aggregates
    const [
      totalWorkspaces,
      activeWorkspaces,
      archivedWorkspaces,
      suspendedWorkspaces,
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProjects,
      totalTasks,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'ACTIVE' }),
      Tenant.countDocuments({ status: 'ARCHIVED' }),
      Tenant.countDocuments({ status: 'SUSPENDED' }),
      User.countDocuments(),
      User.countDocuments({ isActive: true, status: 'ACTIVE' }),
      User.countDocuments({ status: 'SUSPENDED' }),
      Project.countDocuments(),
      Task.countDocuments(),
    ]);

    // Active subscriptions for MRR / Paid status
    const activeSubs = await Subscription.find({
      status: { $in: ['ACTIVE', 'TRIALING'] },
    }).populate('planId');

    let mrr = 0;
    let paidWorkspacesCount = 0;

    for (const sub of activeSubs) {
      const plan = sub.planId as any;
      if (!plan || !plan.isActive) continue;

      if (plan.code === 'PRO') {
        paidWorkspacesCount++;
      }

      if (plan.price > 0) {
        if (plan.billingInterval === 'MONTHLY') {
          mrr += plan.price;
        } else if (plan.billingInterval === 'YEARLY') {
          mrr += plan.price / 12;
        }
      }
    }

    const freeWorkspacesCount = Math.max(0, totalWorkspaces - paidWorkspacesCount);

    // Sum of successful Payments for Total Revenue
    const totalRevAgg = await Payment.aggregate([
      { $match: { status: 'SUCCEEDED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevAgg[0]?.total || 0;

    return NextResponse.json({
      metrics: {
        totalWorkspaces,
        activeWorkspaces,
        archivedWorkspaces,
        suspendedWorkspaces,
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalProjects,
        totalTasks,
        paidWorkspaces: paidWorkspacesCount,
        freeWorkspaces: freeWorkspacesCount,
        mrr: Math.round(mrr * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_OVERVIEW_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
