import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Invitation from '@/models/Invitation';
import Membership from '@/models/Membership';
import User from '@/models/User';
import { checkPlanLimit } from '@/lib/subscription';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';
import * as Yup from 'yup';

const createInviteSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Invalid email address')
    .required('Email is required'),
  role: Yup.string()
    .oneOf(['ADMIN', 'MEMBER'], 'Invalid role selected')
    .required('Role is required'),
});

// GET /api/invitations
// Returns active tenant's pending invitations. Only OWNER and ADMIN.
export async function GET() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);

    await dbConnect();

    // Find pending invitations that are not expired
    const invitations = await Invitation.find({
      tenantId: context.tenant.id,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name')
      .sort({ createdAt: -1 });

    const serialized = invitations.map((inv) => {
      const inviter = inv.invitedBy as unknown as { name: string };
      return {
        id: inv._id.toString(),
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        invitedByName: inviter?.name ?? 'Unknown',
      };
    });

    return NextResponse.json({ invitations: serialized });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[GET /api/invitations]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/invitations
// Creates/sends a workspace email invitation. Only OWNER and ADMIN.
export async function POST(request: Request) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);

    if (context.tenant.status === 'ARCHIVED' || context.tenant.status === 'SUSPENDED') {
      const isSuspended = context.tenant.status === 'SUSPENDED';
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: isSuspended
            ? 'This workspace is suspended. No modifications are allowed.'
            : 'This workspace is archived. No modifications are allowed.'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = await createInviteSchema.validate(body, { abortEarly: false, stripUnknown: true });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: err.errors[0] },
          { status: 422 }
        );
      }
      throw err;
    }

    const email = validatedData.email.toLowerCase().trim();
    const role = validatedData.role as 'ADMIN' | 'MEMBER';

    await dbConnect();

    // 1. Verify target is not already an active member of this tenant
    const targetUser = await User.findOne({ email });
    if (targetUser) {
      const existingMembership = await Membership.findOne({
        userId: targetUser._id,
        tenantId: context.tenant.id,
        status: 'ACTIVE',
      });
      if (existingMembership) {
        return NextResponse.json(
          { error: 'BAD_REQUEST', message: 'This user is already a member of this Workspace.' },
          { status: 400 }
        );
      }
    }

    // 2. Verify target does not already have an active pending invitation in this tenant
    const existingPending = await Invitation.findOne({
      tenantId: context.tenant.id,
      email,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'An invitation is already pending for this email.' },
        { status: 400 }
      );
    }

    // 3. Enforce subscription plan member limits
    // Count active memberships
    const activeCount = await Membership.countDocuments({
      tenantId: context.tenant.id,
      status: 'ACTIVE',
    });

    // Count pending invitations
    const pendingCount = await Invitation.countDocuments({
      tenantId: context.tenant.id,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });

    // Validate limit check
    const limitError = await checkPlanLimit(context.tenant.id, 'maxMembers', activeCount + pendingCount);
    if (limitError) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED', message: limitError.message },
        { status: 403 }
      );
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 5. Save invitation document
    const invitation = new Invitation({
      tenantId: context.tenant.id,
      email,
      role,
      invitedBy: context.user.id,
      tokenHash,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
    });
    await invitation.save();

    // 6. Trigger email sending (best-effort — does NOT block invitation creation)
    let emailDeliveryFailed = false;
    try {
      await sendInvitationEmail({
        email,
        role,
        workspaceName: context.tenant.name,
        inviterName: context.user.name,
        token,
        expiresInDays: 7,
      });
    } catch (emailError) {
      // Email delivery failed but the invitation IS saved.
      // Log server-side for debugging. Do NOT rollback the invitation.
      console.error('[POST /api/invitations] Email delivery failed — invitation saved but email not sent.', emailError);
      emailDeliveryFailed = true;
    }

    return NextResponse.json(
      {
        message: emailDeliveryFailed
          ? 'Invitation created, but the email could not be delivered. Share the invitation link manually.'
          : 'Invitation sent successfully',
        emailDeliveryFailed,
        invitation: {
          id: invitation._id.toString(),
          email: invitation.email,
          role: invitation.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[POST /api/invitations]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Suppress unused imports
void User;
