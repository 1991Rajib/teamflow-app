import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';

export async function POST() {
  try {
    // Only the workspace OWNER can archive the workspace
    const context = await requireTenantAccess(['OWNER']);

    await dbConnect();

    const tenant = await Tenant.findById(context.tenant.id);
    if (!tenant) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    if (tenant.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Workspace is already archived.' }, { status: 400 });
    }

    tenant.status = 'ARCHIVED';
    await tenant.save();

    return NextResponse.json({
      status: 'success',
      message: 'Workspace successfully archived.',
      workspace: {
        id: tenant._id.toString(),
        name: tenant.name,
        status: tenant.status,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied. Only the Workspace Owner can archive the workspace.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
