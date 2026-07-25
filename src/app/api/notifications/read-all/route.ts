import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Notification from '@/models/Notification';

export async function PATCH() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);

    await dbConnect();

    // Mark all notifications as read for current user under current tenant
    const result = await Notification.updateMany(
      {
        recipientId: context.user.id,
        tenantId: context.tenant.id,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return NextResponse.json({
      status: 'success',
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[PATCH /api/notifications/read-all]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
