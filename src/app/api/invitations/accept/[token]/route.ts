import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import dbConnect from '@/lib/db/mongoose';
import Invitation from '@/models/Invitation';
import Membership from '@/models/Membership';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import crypto from 'crypto';

// GET /api/invitations/accept/[token]
// Public endpoint to validate invitation token and return metadata
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await dbConnect();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await Invitation.findOne({ tokenHash })
      .populate('invitedBy', 'name')
      .populate('tenantId', 'name');

    if (!invitation || invitation.status !== 'PENDING') {
      return NextResponse.json({ valid: false, message: 'Invitation is no longer active.' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return NextResponse.json({ valid: false, message: 'Invitation has expired.' });
    }

    const tenant = invitation.tenantId as unknown as { name: string };
    const inviter = invitation.invitedBy as unknown as { name: string };

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      workspaceName: tenant?.name ?? 'Workspace',
      inviterName: inviter?.name ?? 'Workspace Administrator',
      role: invitation.role,
    });
  } catch (error: unknown) {
    console.error('[GET /api/invitations/accept/[token]]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/invitations/accept/[token]
// Accepts a pending workspace invitation for the logged-in user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;


    // 1. Verify user is logged in
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await dbConnect();

    // 2. Hash input token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Invitation not found or invalid token.' },
        { status: 404 }
      );
    }

    // 3. Verify invitation status is PENDING
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: `This invitation is no longer active. Status: ${invitation.status}` },
        { status: 400 }
      );
    }

    // 4. Verify invitation is not expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'This invitation has expired.' },
        { status: 400 }
      );
    }

    // 5. Verify email matches invitation email exactly
    if (currentUser.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'This invitation was sent to a different email address.' },
        { status: 403 }
      );
    }

    // 6. Verify Workspace exists
    const workspace = await Tenant.findById(invitation.tenantId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Workspace no longer exists.' },
        { status: 404 }
      );
    }

    // 7. Find or create membership for this user in this workspace
    let membership = await Membership.findOne({
      tenantId: invitation.tenantId,
      userId: currentUser._id,
    });

    if (membership) {
      membership.status = 'ACTIVE';
      membership.role = invitation.role;
    } else {
      membership = new Membership({
        tenantId: invitation.tenantId,
        userId: currentUser._id,
        role: invitation.role,
        status: 'ACTIVE',
      });
    }

    await membership.save();

    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date();
    await invitation.save();

    return NextResponse.json({
      status: 'success',
      message: 'Workspace invitation accepted successfully.',
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
    });
  } catch (error: unknown) {
    console.error('[POST /api/invitations/accept/[token]]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Suppress unused imports
void User;
