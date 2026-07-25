import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Tenant from '@/models/Tenant';
import * as Yup from 'yup';

const updateWorkspaceSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name must be under 100 characters')
    .required('Workspace name is required'),
  description: Yup.string().trim().max(500, 'Description must be under 500 characters').optional().nullable(),
  companyName: Yup.string().trim().max(100, 'Company name must be under 100 characters').optional().nullable(),
  website: Yup.string().trim().url('Website must be a valid URL').optional().nullable().transform((curr, orig) => orig === '' ? null : curr),
  industry: Yup.string().trim().max(50, 'Industry must be under 50 characters').optional().nullable(),
  companySize: Yup.string().trim().max(50, 'Company size must be under 50 characters').optional().nullable(),
  contactEmail: Yup.string().trim().email('Contact email must be a valid email').optional().nullable().transform((curr, orig) => orig === '' ? null : curr),
  timezone: Yup.string().trim().required('Timezone is required'),
  dateFormat: Yup.string().trim().required('Date format is required'),
  logo: Yup.string().trim().optional().nullable(),
});

export async function GET() {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    await dbConnect();

    const tenant = await Tenant.findById(context.tenant.id);
    if (!tenant) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      workspace: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo || '',
        description: tenant.description || '',
        companyName: tenant.companyName || '',
        website: tenant.website || '',
        industry: tenant.industry || '',
        companySize: tenant.companySize || '',
        contactEmail: tenant.contactEmail || '',
        timezone: tenant.timezone || 'UTC',
        dateFormat: tenant.dateFormat || 'MM/DD/YYYY',
        status: tenant.status || 'ACTIVE',
        role: context.role,
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
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Only OWNER and ADMIN are allowed to update workspace settings
    const context = await requireTenantAccess(['OWNER', 'ADMIN']);

    if (context.tenant.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'This workspace is archived. No modifications are allowed.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    try {
      await updateWorkspaceSchema.validate(body, { abortEarly: false });
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

    await dbConnect();

    const tenant = await Tenant.findById(context.tenant.id);
    if (!tenant) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Workspace not found.' }, { status: 404 });
    }

    // Update settings fields
    tenant.name = body.name.trim();
    tenant.description = body.description ? body.description.trim() : '';
    tenant.companyName = body.companyName ? body.companyName.trim() : '';
    tenant.website = body.website ? body.website.trim() : '';
    tenant.industry = body.industry ? body.industry.trim() : '';
    tenant.companySize = body.companySize ? body.companySize.trim() : '';
    tenant.contactEmail = body.contactEmail ? body.contactEmail.trim() : '';
    tenant.timezone = body.timezone.trim();
    tenant.dateFormat = body.dateFormat.trim();
    if (body.logo !== undefined) {
      tenant.logo = body.logo ? body.logo.trim() : '';
    }

    await tenant.save();

    return NextResponse.json({
      status: 'success',
      message: 'Workspace settings updated successfully',
      workspace: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo || '',
        description: tenant.description || '',
        companyName: tenant.companyName || '',
        website: tenant.website || '',
        industry: tenant.industry || '',
        companySize: tenant.companySize || '',
        contactEmail: tenant.contactEmail || '',
        timezone: tenant.timezone || 'UTC',
        dateFormat: tenant.dateFormat || 'MM/DD/YYYY',
        status: tenant.status || 'ACTIVE',
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
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
