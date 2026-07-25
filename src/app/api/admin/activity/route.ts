import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import PlatformActivity from '@/models/PlatformActivity';
import User from '@/models/User';
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

    await dbConnect();

    const totalCount = await PlatformActivity.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const activitiesDocs = await PlatformActivity.find()
      .populate('adminUserId', 'name email')
      .populate('targetTenantId', 'name')
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const activities = activitiesDocs.map((act) => {
      const admin = act.adminUserId as any;
      const tenant = act.targetTenantId as any;
      const targetUser = act.targetUserId as any;

      return {
        id: act._id.toString(),
        activityType: act.activityType,
        description: act.description,
        timestamp: act.createdAt,
        admin: admin ? { id: admin._id.toString(), name: admin.name, email: admin.email } : null,
        workspace: tenant ? { id: tenant._id.toString(), name: tenant.name } : null,
        targetUser: targetUser
          ? { id: targetUser._id.toString(), name: targetUser.name, email: targetUser.email }
          : null,
      };
    });

    return NextResponse.json({
      activities,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_ACTIVITY_GET_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
