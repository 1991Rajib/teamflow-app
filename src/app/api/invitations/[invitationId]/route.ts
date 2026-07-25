import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Invitation from '@/models/Invitation';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

// DELETE /api/invitations/[invitationId]
// Cancels a pending workspace invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);

    await dbConnect();

    // Verify invitation belongs to the active tenant
    const invitation = await Invitation.findOne({
      _id: invitationId,
      tenantId: context.tenant.id,
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Invitation not found.' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: `Only PENDING invitations can be cancelled. Current: ${invitation.status}` },
        { status: 400 }
      );
    }

    invitation.status = 'CANCELLED';
    invitation.cancelledAt = new Date();
    await invitation.save();

    return NextResponse.json({
      status: 'success',
      message: 'Invitation cancelled successfully.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied.' }, { status: 403 });
    }
    console.error('[DELETE /api/invitations/[invitationId]]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/invitations/[invitationId]
// Resends a pending invitation (regenerates token and extends expiration)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);

    await dbConnect();

    // Verify invitation belongs to the active tenant
    const invitation = await Invitation.findOne({
      _id: invitationId,
      tenantId: context.tenant.id,
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Invitation not found.' },
        { status: 404 }
      );
    }

    // It should be either PENDING or EXPIRED to allow resending
    if (invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Only pending or expired invitations can be resent.' },
        { status: 400 }
      );
    }

    // Regenerate token & hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    invitation.status = 'PENDING';
    invitation.tokenHash = tokenHash;
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset for another 7 days
    invitation.invitedBy = context.user.id as any;
    await invitation.save();

    // Dispatch mock email
    await sendInvitationEmail({
      email: invitation.email,
      role: invitation.role,
      workspaceName: context.tenant.name,
      inviterName: context.user.name,
      token,
      expiresInDays: 7,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Invitation resent successfully.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied.' }, { status: 403 });
    }
    console.error('[POST /api/invitations/[invitationId]]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
