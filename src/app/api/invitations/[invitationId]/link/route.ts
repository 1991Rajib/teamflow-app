import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Invitation from '@/models/Invitation';
import crypto from 'crypto';

// GET /api/invitations/[invitationId]/link
// Generates a new secure token for a pending invitation without modifying its expiration or resending the email.
// Returns the direct invitation URL.
export async function GET(
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
        { error: 'BAD_REQUEST', message: `Only PENDING invitations can be copied. Current: ${invitation.status}` },
        { status: 400 }
      );
    }

    // Regenerate token & hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Only update the tokenHash. Do NOT change expiration, status, or trigger an email.
    invitation.tokenHash = tokenHash;
    await invitation.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${token}`;

    return NextResponse.json({
      status: 'success',
      url: inviteUrl,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied.' }, { status: 403 });
    }
    console.error('[GET /api/invitations/[invitationId]/link]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
