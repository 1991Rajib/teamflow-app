import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import dbConnect from '@/lib/db/mongoose';
import Tenant, { ITenant } from '@/models/Tenant';
import Membership from '@/models/Membership';
import Plan from '@/models/Plan';
import Subscription from '@/models/Subscription';
import { cookies } from 'next/headers';
import * as Yup from 'yup';

const createTenantSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name must be under 100 characters')
    .required('Workspace name is required'),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await dbConnect();

    // Query active memberships for this user
    const memberships = await Membership.find({
      userId: user._id,
      status: 'ACTIVE',
    }).populate('tenantId');

    const workspaces = memberships
      .map((m) => {
        const tenant = m.tenantId as unknown as ITenant;
        if (!tenant || !tenant.isActive) return null;
        return {
          id: tenant._id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          role: m.role,
          logo: tenant.logo || '',
        };
      })
      .filter(Boolean);

    return NextResponse.json({ status: 'success', workspaces });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();

    try {
      await createTenantSchema.validate(body, { abortEarly: false });
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

    const { name } = body;

    await dbConnect();

    // 1. Generate a unique URL slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (await Tenant.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // 2. Locate the FREE plan
    const freePlan = await Plan.findOne({ code: 'FREE', isActive: true });
    if (!freePlan) {
      return NextResponse.json(
        {
          error: 'PLAN_NOT_FOUND',
          message: 'The FREE plan is not seeded. Please contact system administration.',
        },
        { status: 500 }
      );
    }

    // 3. Create Tenant Document
    const tenant = new Tenant({
      name: name.trim(),
      slug,
      ownerId: user._id,
      isActive: true,
    });
    await tenant.save();

    const { logPlatformActivity } = require('@/lib/audit');
    await logPlatformActivity({
      activityType: 'WORKSPACE_CREATED',
      description: `Workspace '${tenant.name}' was created by ${user.name}.`,
      targetTenantId: tenant._id.toString(),
      targetUserId: user._id.toString(),
    });

    let membershipCreated = false;

    try {
      // 4. Create OWNER Membership
      await Membership.create({
        userId: user._id,
        tenantId: tenant._id,
        role: 'OWNER',
        status: 'ACTIVE',
      });
      membershipCreated = true;

      // 5. Create associated FREE Subscription
      await Subscription.create({
        tenantId: tenant._id,
        planId: freePlan._id,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      });
    } catch (dbError) {
      // Rollback to maintain transactional consistency
      if (membershipCreated) {
        await Membership.deleteOne({ userId: user._id, tenantId: tenant._id });
      }
      await Tenant.deleteOne({ _id: tenant._id });
      throw dbError;
    }

    // 6. Set active tenant context cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'activeTenantId',
      value: tenant._id.toString(),
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json(
      {
        status: 'success',
        workspace: {
          id: tenant._id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          role: 'OWNER',
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
