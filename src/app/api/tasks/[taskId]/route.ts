import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';
import * as Yup from 'yup';
import { revalidatePath } from 'next/cache';
import { toUTCMidnightDate } from '@/lib/dateUtils';

const updateTaskSchema = Yup.object().shape({
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
    .required('Status is required'),
  priority: Yup.string()
    .oneOf(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority')
    .required('Priority is required'),
  assignedTo: Yup.string()
    .test('is-objectid-opt', 'Invalid Assigned User ID', (val) => !val || mongoose.Types.ObjectId.isValid(val))
    .optional()
    .nullable(),
  dueDate: Yup.date()
    .optional()
    .nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const { taskId } = await params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Task ID' }, { status: 400 });
    }

    await dbConnect();

    // Query task. Scope with tenantId for safety
    const task = await Task.findOne({
      _id: taskId,
      tenantId: context.tenant.id,
    })
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      task: {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId ? (task.projectId as unknown as { _id: { toString(): string } })._id.toString() : null,
        projectName: tName(task.projectId),
        assignedTo: task.assignedTo ? {
          id: (task.assignedTo as unknown as { _id: { toString(): string } })._id.toString(),
          name: (task.assignedTo as unknown as { name: string }).name,
          email: (task.assignedTo as unknown as { email: string }).email,
        } : null,
        createdBy: task.createdBy ? {
          id: (task.createdBy as unknown as { _id: { toString(): string } })._id.toString(),
          name: (task.createdBy as unknown as { name: string }).name,
          email: (task.createdBy as unknown as { email: string }).email,
        } : null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
      },
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);
    const { taskId } = await params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Task ID' }, { status: 400 });
    }

    const body = await request.json();

    try {
      await updateTaskSchema.validate(body, { abortEarly: false });
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

    // 1. Verify Task exists and belongs to active tenant (IDOR prevention)
    const existingTask = await Task.findOne({ _id: taskId, tenantId: context.tenant.id });
    if (!existingTask) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Task not found' }, { status: 404 });
    }

    // 2. Verify Project belongs to active tenant
    const project = await Project.findOne({ _id: projectId, tenantId: context.tenant.id });
    if (!project) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Selected project is invalid or does not belong to your workspace.' },
        { status: 400 }
      );
    }

    // 3. Verify Assigned User belongs to active tenant
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

    // 4. Update the Task
    const task = await Task.findOneAndUpdate(
      { _id: taskId, tenantId: context.tenant.id },
      {
        $set: {
          title: title.trim(),
          description: description?.trim() || '',
          projectId,
          status,
          priority,
          assignedTo: assignedTo || null,
          dueDate: dueDate ? toUTCMidnightDate(dueDate) : null,
        },
      },
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Task not found' }, { status: 404 });
    }

    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/projects/${task.projectId}`);
    if (existingTask.projectId && existingTask.projectId.toString() !== task.projectId.toString()) {
      revalidatePath(`/projects/${existingTask.projectId}`);
    }
    revalidatePath('/dashboard');

    return NextResponse.json({
      status: 'success',
      task: {
        id: task._id.toString(),
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId.toString(),
        dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
      },
    });
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);
    const { taskId } = await params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Task ID' }, { status: 400 });
    }

    await dbConnect();

    // Secure database delete, scoped strictly to the tenant
    const task = await Task.findOneAndDelete({
      _id: taskId,
      tenantId: context.tenant.id,
    });

    if (!task) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Task not found' }, { status: 404 });
    }

    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath('/dashboard');

    return NextResponse.json({
      status: 'success',
      message: 'Task has been successfully deleted.',
    });
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

function tName(obj: unknown): string {
  if (obj && typeof obj === 'object' && 'name' in obj) {
    return (obj as { name: string }).name;
  }
  return 'Unassigned';
}
