import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import Membership from '@/models/Membership';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Valid tenantId is required.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify membership of the requesting user in the target tenant workspace
    const membership = await Membership.findOne({
      userId: user._id,
      tenantId,
      status: 'ACTIVE',
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'You do not have access to this workspace.',
        },
        { status: 403 }
      );
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findOne({ _id: tenantId, isActive: true });
    if (!tenant) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Workspace not found or is currently inactive.',
        },
        { status: 404 }
      );
    }

    // Update active workspace cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'activeTenantId',
      value: tenantId,
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({
      status: 'success',
      activeTenantId: tenantId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
