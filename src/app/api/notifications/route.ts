import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Notification from '@/models/Notification';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);

    await dbConnect();

    // Retrieve notifications for the authenticated user and active tenant
    const notifications = await Notification.find({
      recipientId: context.user.id,
      tenantId: context.tenant.id,
    })
      .populate('actorId', 'name')
      .sort({ createdAt: -1 });

    const serialized = notifications.map((n) => {
      const actor = n.actorId as unknown as { name: string };
      return {
        id: n._id.toString(),
        recipientId: n.recipientId.toString(),
        actorName: actor?.name ?? 'Someone',
        type: n.type,
        taskId: n.taskId.toString(),
        projectId: n.projectId.toString(),
        commentId: n.commentId.toString(),
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      };
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: serialized,
      unreadCount,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[GET /api/notifications]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Suppress unused imports
void User;
