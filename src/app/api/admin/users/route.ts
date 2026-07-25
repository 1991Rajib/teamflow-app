import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import Membership from '@/models/Membership';
import Tenant from '@/models/Tenant';

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
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    const workspaceFilter = searchParams.get('workspace') || '';

    await dbConnect();

    // 1. Build query filters
    let query: any = {};

    // Search query
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Role filter
    if (roleFilter) {
      query.platformRole = roleFilter.toUpperCase();
    }

    // Status filter
    if (statusFilter) {
      query.status = statusFilter.toUpperCase();
    }

    // Workspace filter
    if (workspaceFilter) {
      const memberships = await Membership.find({ tenantId: workspaceFilter }).select('userId');
      const userIds = memberships.map((m) => m.userId);

      if (query._id) {
        const searchIds = Array.isArray(query._id.$in) ? query._id.$in.map(String) : [];
        const intersection = userIds.filter((id) => searchIds.includes(id.toString()));
        query._id = { $in: intersection };
      } else {
        query._id = { $in: userIds };
      }
    }

    // 2. Count documents
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // 3. Retrieve paginated users list
    const usersDocs = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // 4. Gather workspace memberships for each user
    const users = [];
    for (const u of usersDocs) {
      const memberships = await Membership.find({ userId: u._id }).populate('tenantId', 'name');

      const workspaces = memberships
        .map((m) => {
          const tenant = m.tenantId as any;
          if (!tenant) return null;
          return {
            id: tenant._id.toString(),
            name: tenant.name,
            role: m.role,
            status: m.status,
          };
        })
        .filter(Boolean);

      users.push({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        platformRole: u.platformRole,
        isActive: u.isActive,
        status: u.status || 'ACTIVE',
        createdAt: u.createdAt,
        workspaces,
      });
    }

    return NextResponse.json({
      users,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_USERS_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
