import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';
import * as Yup from 'yup';

import Task from '@/models/Task';

const updateRoleSchema = Yup.object().shape({
  role: Yup.string()
    .oneOf(['ADMIN', 'MEMBER'], 'Invalid role value')
    .required('Role is required'),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    // Only OWNER can change roles
    const context = await requireTenantAccess(['OWNER']);
    const { membershipId } = await params;

    if (!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid Membership ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate inputs
    try {
      await updateRoleSchema.validate(body, { abortEarly: false });
    } catch (validationError: unknown) {
      if (validationError instanceof Yup.ValidationError) {
        const errors = validationError.inner.reduce<Record<string, string>>((acc, curr) => {
          if (curr.path) {
            acc[curr.path] = curr.message;
          }
          return acc;
        }, {});
        return NextResponse.json({ status: 'validation_error', errors }, { status: 400 });
      }
      throw validationError;
    }

    const { role } = body;
    await dbConnect();

    // Find the target membership
    const targetMembership = await Membership.findById(membershipId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Membership not found' },
        { status: 404 }
      );
    }

    // Tenant isolation check
    if (targetMembership.tenantId.toString() !== context.tenant.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied.' },
        { status: 403 }
      );
    }

    // Cannot modify OWNER membership
    if (targetMembership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot modify Owner role.' },
        { status: 403 }
      );
    }

    // Cannot modify self
    if (targetMembership.userId.toString() === context.user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot modify your own role.' },
        { status: 403 }
      );
    }

    // Verify target membership is active
    if (targetMembership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Cannot modify an inactive membership.' },
        { status: 400 }
      );
    }

    // Update role
    targetMembership.role = role as 'ADMIN' | 'MEMBER';
    await targetMembership.save();

    return NextResponse.json({
      status: 'success',
      membership: {
        id: targetMembership._id.toString(),
        userId: targetMembership.userId.toString(),
        tenantId: targetMembership.tenantId.toString(),
        role: targetMembership.role,
        status: targetMembership.status,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    // Both OWNER and ADMIN can remove members
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);
    const { membershipId } = await params;

    if (!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid Membership ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the target membership
    const targetMembership = await Membership.findById(membershipId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Membership not found' },
        { status: 404 }
      );
    }

    // Tenant isolation check
    if (targetMembership.tenantId.toString() !== context.tenant.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied.' },
        { status: 403 }
      );
    }

    // Cannot remove OWNER
    if (targetMembership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot remove the workspace owner.' },
        { status: 403 }
      );
    }

    // Cannot remove self
    if (targetMembership.userId.toString() === context.user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You cannot remove yourself from the team.' },
        { status: 403 }
      );
    }

    // Verify target membership is active
    if (targetMembership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Membership is already inactive.' },
        { status: 400 }
      );
    }

    // ADMIN can only remove MEMBER level users
    if (context.role === 'ADMIN' && targetMembership.role !== 'MEMBER') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admins can only remove Member-level users.' },
        { status: 403 }
      );
    }

    // Set membership status to SUSPENDED (soft-deletion/deactivation)
    targetMembership.status = 'SUSPENDED';
    await targetMembership.save();

    // Clean up active task assignments for this member within this workspace
    await Task.updateMany(
      { tenantId: context.tenant.id, assignedTo: targetMembership.userId },
      { $set: { assignedTo: null } }
    );

    return NextResponse.json({
      status: 'success',
      message: 'Member removed from workspace successfully.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
