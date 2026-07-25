import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const { notificationId } = await params;

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid Notification ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify notification belongs to the current recipient and active tenant
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: context.user.id,
      tenantId: context.tenant.id,
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Notification not found' },
        { status: 404 }
      );
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({
      status: 'success',
      message: 'Notification marked as read',
      notification: {
        id: notification._id.toString(),
        read: notification.read,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[PATCH /api/notifications/[notificationId]/read]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
