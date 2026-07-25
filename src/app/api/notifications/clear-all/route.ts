import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Notification from '@/models/Notification';

export async function DELETE() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    
    await dbConnect();
    
    // Delete all notifications for the current user in the current tenant
    await Notification.deleteMany({
      tenantId: context.tenant.id,
      recipientId: context.user.id,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[DELETE /api/notifications/clear-all]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
