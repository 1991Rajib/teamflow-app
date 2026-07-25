import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Membership from '@/models/Membership';
import { checkPlanLimit } from '@/lib/subscription';
import mongoose from 'mongoose';
import * as Yup from 'yup';
import { revalidatePath } from 'next/cache';
import { toUTCMidnightDate } from '@/lib/dateUtils';


const createTaskSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(150, 'Task title must be under 150 characters')
    .required('Task title is required'),
  description: Yup.string()
    .trim()
    .max(1000, 'Description must be under 1000 characters')
    .optional()
    .nullable(),
  projectId: Yup.string()
    .test('is-objectid', 'Invalid Project ID', (val) => !val || mongoose.Types.ObjectId.isValid(val))
    .required('Project is required'),
  status: Yup.string()
    .oneOf(['TODO', 'IN_PROGRESS', 'DONE'], 'Invalid status')
    .default('TODO'),
  priority: Yup.string()
    .oneOf(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority')
    .default('MEDIUM'),
  assignedTo: Yup.string()
    .test('is-objectid-opt', 'Invalid Assigned User ID', (val) => !val || mongoose.Types.ObjectId.isValid(val))
    .optional()
    .nullable(),
  dueDate: Yup.date()
    .optional()
    .nullable(),
});

export async function GET(request: Request) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const searchParams = new URL(request.url).searchParams;

    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const projectId = searchParams.get('projectId') || '';

    await dbConnect();

    // Fetch active projects to filter out archived projects' tasks
    const activeProjects = await Project.find({ tenantId: context.tenant.id, status: 'ACTIVE' }, '_id');
    const activeProjectIds = activeProjects.map((p) => p._id);

    // 1. Core query scoped exclusively to the active tenant and active projects
    const query: Record<string, unknown> = {
      tenantId: context.tenant.id,
      projectId: { $in: activeProjectIds },
    };

    if (q.trim()) {
      query.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    // 2. Validate projectId and ownership if querying by project
    if (projectId && projectId !== 'ALL') {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Project ID' }, { status: 400 });
      }

      // Secure project boundaries check and check if ACTIVE
      const project = await Project.findOne({ _id: projectId, tenantId: context.tenant.id, status: 'ACTIVE' });
      if (!project) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Project not found or is archived in this workspace' }, { status: 404 });
      }

      query.projectId = projectId;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      status: 'success',
      tasks: tasks.map((t) => {
        const populatedProject = t.projectId as unknown as { _id: { toString(): string }; name: string } | null;
        const populatedUser = t.assignedTo as unknown as { _id: { toString(): string }; name: string; email: string } | null;
        return {
          id: t._id.toString(),
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          projectId: populatedProject ? populatedProject._id.toString() : null,
          projectName: populatedProject ? populatedProject.name : 'Unassigned',
          assignedTo: populatedUser ? {
            id: populatedUser._id.toString(),
            name: populatedUser.name,
            email: populatedUser.email,
          } : null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          // Return date-only string: "YYYY-MM-DD" — no timezone, no offset risk
          dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
        };
      }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied.' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only OWNER and ADMIN are allowed to create tasks
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

    // Validate body input structure
    try {
      await createTaskSchema.validate(body, { abortEarly: false });
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

    const { title, description, projectId, status, priority, assignedTo, dueDate } = body;
    await dbConnect();

    // 1. Verify Project belongs to active tenant (IDOR check)
    const project = await Project.findOne({ _id: projectId, tenantId: context.tenant.id });
    if (!project) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Project does not exist or does not belong to your workspace.' },
        { status: 400 }
      );
    }

    // 2. Verify Assigned User (if provided) belongs to active tenant (IDOR check)
    if (assignedTo) {
      const assigneeMembership = await Membership.findOne({
        userId: assignedTo,
        tenantId: context.tenant.id,
        status: 'ACTIVE',
      });

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: 'BAD_REQUEST', message: 'Assigned user is not a member of this workspace.' },
          { status: 400 }
        );
      }
    }

    // ── Feature Gating: Check maxTasksPerProject plan limit ───────────────
    const currentTaskCount = await Task.countDocuments({
      tenantId: context.tenant.id,
      projectId,
    });

    const limitError = await checkPlanLimit(
      context.tenant.id,
      'maxTasksPerProject',
      currentTaskCount
    );
    if (limitError) {
      return NextResponse.json(
        {
          status: 'limit_reached',
          limitType: 'tasks',
          current: limitError.current,
          maxAllowed: limitError.maxAllowed,
          message: limitError.message,
        },
        { status: 403 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    // 3. Create the Task. Force tenantId and createdBy from server context

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      projectId,
      tenantId: context.tenant.id,
      createdBy: context.user.id,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      assignedTo: assignedTo || null,
      // Store as UTC midnight from a YYYY-MM-DD string — stable across all timezones
      dueDate: dueDate ? toUTCMidnightDate(dueDate) : null,
    });

    await task.save();

    revalidatePath('/tasks');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/dashboard');

    return NextResponse.json(
      {
        status: 'success',
        task: {
          id: task._id.toString(),
          title: task.title,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId.toString(),
          createdAt: task.createdAt,
          dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
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
      return NextResponse.json({ error: 'FORBIDDEN', message: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
