import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import { checkPlanLimit } from '@/lib/subscription';
import * as Yup from 'yup';

const createProjectSchema = Yup.object().shape({
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
});

export async function GET() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    await dbConnect();

    // Query projects scoped exclusively to active tenant
    const projects = await Project.find({ tenantId: context.tenant.id }).sort({ createdAt: -1 });

    return NextResponse.json({
      status: 'success',
      projects: projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
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
    // Only OWNER and ADMIN are allowed to create projects
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

    // Validate body inputs
    try {
      await createProjectSchema.validate(body, { abortEarly: false });
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

    const { name, description } = body;
    await dbConnect();

    // ── Feature Gating: Check maxProjects plan limit ──────────────────────
    const currentProjectCount = await Project.countDocuments({
      tenantId: context.tenant.id,
      status: 'ACTIVE',
    });

    const limitError = await checkPlanLimit(context.tenant.id, 'maxProjects', currentProjectCount);
    if (limitError) {
      return NextResponse.json(
        {
          status: 'limit_reached',
          limitType: 'projects',
          current: limitError.current,
          maxAllowed: limitError.maxAllowed,
          message: limitError.message,
        },
        { status: 403 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    // Create the project document. Force set tenantId and createdBy on server
    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      tenantId: context.tenant.id,
      createdBy: context.user.id,
      status: 'ACTIVE',
    });

    await project.save();

    return NextResponse.json(
      {
        status: 'success',
        project: {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
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


