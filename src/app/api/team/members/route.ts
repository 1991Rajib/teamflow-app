import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Membership from '@/models/Membership';
import User from '@/models/User';

export async function GET() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);

    await dbConnect();

    // Retrieve active memberships in the current tenant, populating user details
    const memberships = await Membership.find({
      tenantId: context.tenant.id,
      status: 'ACTIVE',
    }).populate('userId', 'name email avatarUrl');

    const members = memberships
      .map((m) => {
        const u = m.userId as unknown as { _id: { toString(): string }; name: string; email: string; avatarUrl?: string };
        if (!u) return null;
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl || '',
        };
      })
      .filter((m) => m !== null && m.id !== context.user.id);

    return NextResponse.json({ members });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[GET /api/team/members]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Suppress unused imports
void User;
