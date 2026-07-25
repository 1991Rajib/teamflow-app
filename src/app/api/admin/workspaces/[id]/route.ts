import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Membership from '@/models/Membership';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Subscription from '@/models/Subscription';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import { logPlatformActivity } from '@/lib/audit';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await props.params;
    await dbConnect();

    const workspace = await Tenant.findById(id);
    if (!workspace) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    const ownerMembership = await Membership.findOne({
      tenantId: id,
      role: 'OWNER',
    }).populate('userId', 'name email');

    const ownerUser = ownerMembership?.userId as any;
    const owner = ownerUser
      ? { id: ownerUser._id.toString(), name: ownerUser.name, email: ownerUser.email }
      : { id: '', name: 'Unknown', email: 'Unknown' };

    const [memberships, projects, tasks, subscription] = await Promise.all([
      Membership.find({ tenantId: id }).populate('userId', 'name email platformRole'),
      Project.find({ tenantId: id }).sort({ createdAt: -1 }),
      Task.find({ tenantId: id }).populate('projectId', 'name').populate('assignedTo', 'name').sort({ createdAt: -1 }),
      Subscription.findOne({ tenantId: id }).populate('planId'),
    ]);

    const members = memberships.map((m) => {
      const u = m.userId as any;
      return {
        membershipId: m._id.toString(),
        userId: u?._id.toString() || '',
        name: u?.name || 'Unknown',
        email: u?.email || 'Unknown',
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      };
    });

    const activeProjects = projects.filter((p) => p.status === 'ACTIVE');

    return NextResponse.json({
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo || '',
        description: workspace.description || '',
        companyName: workspace.companyName || '',
        website: workspace.website || '',
        industry: workspace.industry || '',
        companySize: workspace.companySize || '',
        contactEmail: workspace.contactEmail || '',
        timezone: workspace.timezone || 'UTC',
        dateFormat: workspace.dateFormat || 'MM/DD/YYYY',
        status: workspace.status || 'ACTIVE',
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      owner,
      members,
      projects: projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
      })),
      tasks: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectName: (t.projectId as any)?.name || 'Unassigned',
        assignedToName: (t.assignedTo as any)?.name || 'Unassigned',
        createdAt: t.createdAt,
      })),
      subscription: subscription
        ? {
            id: subscription._id.toString(),
            status: subscription.status,
            stripeCustomerId: subscription.stripeCustomerId || null,
            stripeSubscriptionId: subscription.stripeSubscriptionId || null,
            currentPeriodStart: subscription.currentPeriodStart || null,
            currentPeriodEnd: subscription.currentPeriodEnd || null,
            plan: {
              name: (subscription.planId as any)?.name || 'PRO',
              code: (subscription.planId as any)?.code || 'PRO',
              price: (subscription.planId as any)?.price || 0,
              billingInterval: (subscription.planId as any)?.billingInterval || 'MONTHLY',
            },
          }
        : null,
      usage: {
        membersCount: members.filter((m) => m.status === 'ACTIVE').length,
        projectsCount: activeProjects.length,
        tasksCount: tasks.length,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_WORKSPACE_GET_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACTIVE', 'ARCHIVED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid status value.' }, { status: 400 });
    }

    await dbConnect();

    const oldWorkspace = await Tenant.findById(id);
    if (!oldWorkspace) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    const workspace = await Tenant.findByIdAndUpdate(id, { status }, { new: true });
    if (!workspace) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    // Log Platform Audit activity
    let activityType: any = 'WORKSPACE_REACTIVATED';
    let activityDesc = `Workspace '${workspace.name}' status set to Active.`;
    if (status === 'SUSPENDED') {
      activityType = 'WORKSPACE_SUSPENDED';
      activityDesc = `Workspace '${workspace.name}' suspended.`;
    } else if (status === 'ARCHIVED') {
      activityType = 'WORKSPACE_SUSPENDED'; // Fallback to audit category
      activityDesc = `Workspace '${workspace.name}' archived.`;
    }

    await logPlatformActivity({
      activityType,
      description: activityDesc,
      adminUserId: session.user.id,
      targetTenantId: id,
    });

    return NextResponse.json({
      status: 'success',
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        status: workspace.status,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_WORKSPACE_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await props.params;
    await dbConnect();

    const workspace = await Tenant.findById(id);
    if (!workspace) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    // Dangerous/Destructive wipe (handles referential integrity)
    await Promise.all([
      Membership.deleteMany({ tenantId: id }),
      Project.deleteMany({ tenantId: id }),
      Task.deleteMany({ tenantId: id }),
      Comment.deleteMany({ tenantId: id }),
      Notification.deleteMany({ tenantId: id }),
      Subscription.deleteMany({ tenantId: id }),
      Tenant.findByIdAndDelete(id),
    ]);

    await logPlatformActivity({
      activityType: 'WORKSPACE_DELETED',
      description: `Workspace '${workspace.name}' permanently deleted along with all its members, projects, and tasks.`,
      adminUserId: session.user.id,
      targetTenantId: id,
    });

    return NextResponse.json({
      status: 'success',
      message: `Workspace '${workspace.name}' successfully deleted.`,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_WORKSPACE_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
