import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import mongoose from 'mongoose';
import * as Yup from 'yup';

const updateProjectSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be under 100 characters')
    .required('Project name is required'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .nullable(),
  status: Yup.string()
    .oneOf(['ACTIVE', 'ARCHIVED'], 'Invalid status value')
    .required('Status is required'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const { projectId } = await params;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Project ID' }, { status: 400 });
    }

    await dbConnect();

    // Query both by projectId and tenantId to guarantee tenant isolation
    const project = await Project.findOne({
      _id: projectId,
      tenantId: context.tenant.id,
    });

    if (!project) {
      // 404 response to avoid leaking the existence of projects in other tenants
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);
    const { projectId } = await params;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Project ID' }, { status: 400 });
    }

    const body = await request.json();

    try {
      await updateProjectSchema.validate(body, { abortEarly: false });
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

    const { name, description, status } = body;
    await dbConnect();

    // Secure database update, scoped strictly to the tenant
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        tenantId: context.tenant.id,
      },
      {
        $set: {
          name: name.trim(),
          description: description?.trim() || '',
          status,
        },
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        status: project.status,
        updatedAt: project.updatedAt,
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

import Task from '@/models/Task';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);
    const { projectId } = await params;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid Project ID' }, { status: 400 });
    }

    await dbConnect();

    // Verify project has no tasks before allowing deletion (cascade prevention)
    const taskCount = await Task.countDocuments({
      projectId,
      tenantId: context.tenant.id,
    });

    if (taskCount > 0) {
      return NextResponse.json(
        {
          error: 'BAD_REQUEST',
          message: 'This project contains tasks. Remove or archive its tasks before deleting the project.',
        },
        { status: 400 }
      );
    }

    // Secure database delete, scoped strictly to the tenant
    const project = await Project.findOneAndDelete({
      _id: projectId,
      tenantId: context.tenant.id,
    });

    if (!project) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Project has been successfully deleted.',
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
