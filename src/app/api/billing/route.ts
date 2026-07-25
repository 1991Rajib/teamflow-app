import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import { getTenantSubscription } from '@/lib/subscription';
import { formatLimit } from '@/config/plans';
import Membership from '@/models/Membership';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Payment from '@/models/Payment';

/**
 * GET /api/billing
 * Returns the tenant's current subscription details, usage metrics, and payment history.
 * Accessible to all tenant roles, but upgrade actions are OWNER-only (enforced in UI).
 */
export async function GET() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);

    await dbConnect();

    const { subscription, planCode, limits } = await getTenantSubscription(context.tenant.id);

    // Fetch active projects to filter out archived projects' tasks from billing usage counts
    const activeProjects = await Project.find({ tenantId: context.tenant.id, status: 'ACTIVE' }, '_id');
    const activeProjectIds = activeProjects.map((p) => p._id);

    // Fetch current usage counts (parallelized)
    const [memberCount, projectCount, payments] = await Promise.all([
      Membership.countDocuments({ tenantId: context.tenant.id, status: 'ACTIVE' }),
      Project.countDocuments({ tenantId: context.tenant.id, status: 'ACTIVE' }),
      Payment.find({ tenantId: context.tenant.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Task count across all active projects in this tenant
    const taskCount = await Task.countDocuments({ tenantId: context.tenant.id, projectId: { $in: activeProjectIds } });

    return NextResponse.json({
      status: 'success',
      billing: {
        planCode,
        subscriptionStatus: subscription?.status ?? 'ACTIVE',
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        stripeCustomerId: subscription?.stripeCustomerId ?? null,
        stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
      },
      limits: {
        maxMembers: formatLimit(limits.maxMembers),
        maxProjects: formatLimit(limits.maxProjects),
        maxTasksPerProject: formatLimit(limits.maxTasksPerProject),
        rawMaxMembers: limits.maxMembers,
        rawMaxProjects: limits.maxProjects,
        rawMaxTasksPerProject: limits.maxTasksPerProject,
      },
      usage: {
        members: memberCount,
        projects: projectCount,
        tasks: taskCount,
      },
      payments: payments.map((p) => ({
        id: p._id.toString(),
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        createdAt: p.createdAt,
      })),
      callerRole: context.role,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
