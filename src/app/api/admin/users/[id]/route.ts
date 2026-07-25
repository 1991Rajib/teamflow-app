import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import Membership from '@/models/Membership';
import Tenant from '@/models/Tenant';
import { logPlatformActivity } from '@/lib/audit';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await props.params;
    await dbConnect();

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found.' }, { status: 404 });
    }

    // Retrieve memberships
    const memberships = await Membership.find({ userId: id }).populate('tenantId', 'name');

    const workspaces = memberships
      .map((m) => {
        const tenant = m.tenantId as any;
        if (!tenant) return null;
        return {
          id: tenant._id.toString(),
          name: tenant.name,
          role: m.role,
          status: m.status,
          createdAt: m.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
        isActive: user.isActive,
        status: user.status || 'ACTIVE',
        createdAt: user.createdAt,
      },
      workspaces,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_USER_GET_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { platformRole, status } = body;

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found.' }, { status: 404 });
    }

    // Role protection safety (never demote the final admin)
    if (
      (platformRole && platformRole === 'USER' && targetUser.platformRole === 'PLATFORM_ADMIN') ||
      (status && status === 'SUSPENDED' && targetUser.platformRole === 'PLATFORM_ADMIN')
    ) {
      const activeAdminCount = await User.countDocuments({
        platformRole: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            error: 'FORBIDDEN',
            message:
              'Operation Denied: This is the final remaining active Platform Administrator. Demoting or suspending this user is blocked to prevent platform lockout.',
          },
          { status: 403 }
        );
      }
    }

    // Update target fields
    const updates: any = {};
    if (platformRole) updates.platformRole = platformRole;
    if (status) updates.status = status;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');

    // Audit Log Activity
    if (platformRole && platformRole !== targetUser.platformRole) {
      const isPromo = platformRole === 'PLATFORM_ADMIN';
      await logPlatformActivity({
        activityType: isPromo ? 'ADMIN_PROMOTED' : 'ADMIN_DEMOTED',
        description: isPromo
          ? `User '${targetUser.name}' promoted to Platform Admin.`
          : `Platform Admin '${targetUser.name}' demoted to normal User.`,
        adminUserId: session.user.id,
        targetUserId: id,
      });
    }

    if (status && status !== targetUser.status) {
      const isSuspended = status === 'SUSPENDED';
      await logPlatformActivity({
        activityType: isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
        description: isSuspended
          ? `User '${targetUser.name}' suspended from the platform.`
          : `Suspended user '${targetUser.name}' account reactivated.`,
        adminUserId: session.user.id,
        targetUserId: id,
      });
    }

    return NextResponse.json({
      status: 'success',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_USER_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
