import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Membership from '@/models/Membership';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const searchQuery = searchParams.get('q')?.trim() || '';
    const planFilter = searchParams.get('plan') || '';
    const statusFilter = searchParams.get('status') || '';
    const sortParam = searchParams.get('sort') || 'createdAt_desc';

    await dbConnect();

    // 1. Build query filters
    let query: any = {};

    // Search filter
    if (searchQuery) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      }).select('_id');
      const matchedUserIds = matchedUsers.map((u) => u._id);

      const matchedOwnerMemberships = await Membership.find({
        userId: { $in: matchedUserIds },
        role: 'OWNER',
      }).select('tenantId');
      const matchedTenantIds = matchedOwnerMemberships.map((m) => m.tenantId);

      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { _id: { $in: matchedTenantIds } },
      ];
    }

    // Plan filter
    if (planFilter) {
      const targetPlan = await Plan.findOne({ code: planFilter.toUpperCase() as any });
      if (targetPlan) {
        const matchingSubs = await Subscription.find({ planId: targetPlan._id }).select('tenantId');
        const tenantIds = matchingSubs.map((s) => s.tenantId);
        
        // Intersect if search filter already populated _id
        if (query._id) {
          const searchIds = Array.isArray(query._id.$in) ? query._id.$in.map(String) : [];
          const intersection = tenantIds.filter((id) => searchIds.includes(id.toString()));
          query._id = { $in: intersection };
        } else {
          query._id = { $in: tenantIds };
        }
      } else {
        query._id = { $in: [] };
      }
    }

    // Status filter
    if (statusFilter) {
      query.status = statusFilter.toUpperCase();
    }

    // Sorting query
    let sortQuery: any = { createdAt: -1 };
    if (sortParam === 'createdAt_asc') {
      sortQuery = { createdAt: 1 };
    } else if (sortParam === 'name_asc') {
      sortQuery = { name: 1 };
    } else if (sortParam === 'name_desc') {
      sortQuery = { name: -1 };
    }

    // 2. Count documents
    const totalCount = await Tenant.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // 3. Retrieve paginated workspaces
    const workspacesDocs = await Tenant.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit);

    // 4. Gather metrics for each workspace
    const workspaces = [];
    for (const ws of workspacesDocs) {
      const tenantId = ws._id.toString();

      // Find OWNER membership
      const ownerMembership = await Membership.findOne({
        tenantId: ws._id,
        role: 'OWNER',
      }).populate('userId', 'name email');

      const ownerUser = ownerMembership?.userId as any;
      const owner = ownerUser
        ? { id: ownerUser._id.toString(), name: ownerUser.name, email: ownerUser.email }
        : { id: '', name: 'Unknown', email: 'Unknown' };

      // Parallelize counts
      const [memberCount, projectCount, taskCount, subscription] = await Promise.all([
        Membership.countDocuments({ tenantId: ws._id, status: 'ACTIVE' }),
        Project.countDocuments({ tenantId: ws._id }),
        Task.countDocuments({ tenantId: ws._id }),
        Subscription.findOne({ tenantId: ws._id }).populate('planId', 'code price'),
      ]);

      const planCode = (subscription?.planId as any)?.code || 'FREE';
      const subStatus = subscription?.status || 'ACTIVE';

      workspaces.push({
        id: tenantId,
        name: ws.name,
        slug: ws.slug,
        status: ws.status || 'ACTIVE',
        createdAt: ws.createdAt,
        owner,
        memberCount,
        projectCount,
        taskCount,
        plan: planCode,
        subscriptionStatus: subStatus,
      });
    }

    return NextResponse.json({
      workspaces,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_WORKSPACES_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
