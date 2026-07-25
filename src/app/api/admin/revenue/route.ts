import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import Payment from '@/models/Payment';

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

    // 2. Fetch active subscriptions for MRR & ARR
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

    const arr = mrr * 12;

    // 3. Count total active workspaces
    const totalActiveWorkspaces = await Tenant.countDocuments({ status: 'ACTIVE' });
    const arpu = totalActiveWorkspaces > 0 ? mrr / totalActiveWorkspaces : 0;

    // 4. Calculate total revenue metrics from Payment collection
    const [revenueThisMonth, revenueLastMonth, totalRevenue, successfulPaymentsCount, failedPaymentsCount] =
      await Promise.all([
        Payment.aggregate([
          {
            $match: {
              status: 'SUCCEEDED',
              createdAt: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: 'SUCCEEDED',
              createdAt: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { status: 'SUCCEEDED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.countDocuments({ status: 'SUCCEEDED' }),
        Payment.countDocuments({ status: 'FAILED' }),
      ]);

    const revThisMonthVal = revenueThisMonth[0]?.total || 0;
    const revLastMonthVal = revenueLastMonth[0]?.total || 0;
    const totalRevVal = totalRevenue[0]?.total || 0;

    // 5. Query paginated payments invoices list
    const paymentsCount = await Payment.countDocuments();
    const paymentsPages = Math.ceil(paymentsCount / limit);

    const paymentDocs = await Payment.find()
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const payments = paymentDocs.map((p) => {
      const tenant = p.tenantId as any;
      return {
        id: p._id.toString(),
        workspaceName: tenant?.name || 'Purged Workspace',
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        providerPaymentId: p.providerPaymentId || null,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      revenue: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        arpu: Math.round(arpu * 100) / 100,
        revenueThisMonth: Math.round(revThisMonthVal * 100) / 100,
        revenueLastMonth: Math.round(revLastMonthVal * 100) / 100,
        totalRevenue: Math.round(totalRevVal * 100) / 100,
        successfulPaymentsCount,
        failedPaymentsCount,
      },
      payments,
      pagination: {
        totalCount: paymentsCount,
        totalPages: paymentsPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_REVENUE_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
