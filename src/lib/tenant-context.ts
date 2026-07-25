import 'server-only';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import Tenant, { ITenant } from '@/models/Tenant';
import Membership from '@/models/Membership';
import { getCurrentUser } from '@/lib/auth-utils';
import mongoose from 'mongoose';

export interface TenantContext {
  user: {
    id: string;
    name: string;
    email: string;
    platformRole: 'USER' | 'PLATFORM_ADMIN';
    isActive: boolean;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
    logo?: string;
  };
  membership: {
    id: string;
    userId: string;
    tenantId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  };
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

/**
 * Resolves the currently active tenant context for the authenticated session.
 * If activeTenantId cookie is missing or invalid, it defaults to the user's first active membership.
 * Returns null if the user has no memberships or is unauthenticated.
 */
export async function getActiveTenantContext(): Promise<TenantContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  await dbConnect();

  const cookieStore = await cookies();
  let tenantId = cookieStore.get('activeTenantId')?.value;

  // Resolve to default (first active workspace) if cookie is missing/invalid
  if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
    const firstMembership = await Membership.findOne({
      userId: user._id,
      status: 'ACTIVE',
    }).populate('tenantId');

    if (!firstMembership) {
      return null;
    }

    const tenantDoc = firstMembership.tenantId as unknown as ITenant;
    if (!tenantDoc || !tenantDoc.isActive) {
      return null;
    }

    tenantId = tenantDoc._id.toString();
  }

  // Double-verify membership for security (prevents IDOR)
  const membership = await Membership.findOne({
    userId: user._id,
    tenantId,
    status: 'ACTIVE',
  });

  if (!membership) {
    // If invalid membership, fallback to check if user has ANY other workspace
    const alternativeMembership = await Membership.findOne({
      userId: user._id,
      status: 'ACTIVE',
    }).populate('tenantId');

    if (!alternativeMembership) {
      return null;
    }

    const altTenantDoc = alternativeMembership.tenantId as unknown as ITenant;
    if (!altTenantDoc || !altTenantDoc.isActive) {
      return null;
    }

    // Return the alternative tenant context instead
    const altTenant = await Tenant.findOne({ _id: altTenantDoc._id, isActive: true });
    if (!altTenant) return null;

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
        isActive: user.isActive,
      },
      tenant: {
        id: altTenant._id.toString(),
        name: altTenant.name,
        slug: altTenant.slug,
        isActive: altTenant.isActive,
        status: altTenant.status || 'ACTIVE',
        logo: altTenant.logo || '',
      },
      membership: {
        id: alternativeMembership._id.toString(),
        userId: alternativeMembership.userId.toString(),
        tenantId: alternativeMembership.tenantId.toString(),
        role: alternativeMembership.role,
        status: alternativeMembership.status,
      },
      role: alternativeMembership.role,
    };
  }

  const tenant = await Tenant.findOne({ _id: tenantId, isActive: true });
  if (!tenant) {
    return null;
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      platformRole: user.platformRole,
      isActive: user.isActive,
    },
    tenant: {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      status: tenant.status || 'ACTIVE',
      logo: tenant.logo || '',
    },
    membership: {
      id: membership._id.toString(),
      userId: membership.userId.toString(),
      tenantId: membership.tenantId.toString(),
      role: membership.role,
      status: membership.status,
    },
    role: membership.role,
  };
}

/**
 * Reusable server-side role-based authorization guard helper.
 * Throws an error or returns null if user lacks membership or required roles.
 */
export async function requireTenantAccess(allowedRoles?: ('OWNER' | 'ADMIN' | 'MEMBER')[]) {
  const context = await getActiveTenantContext();

  if (!context) {
    throw new Error('UNAUTHORIZED');
  }

  if (allowedRoles && !allowedRoles.includes(context.role)) {
    throw new Error('FORBIDDEN');
  }

  return context;
}

/**
 * Global platform administrator authorization guard.
 */
export async function requirePlatformAdmin() {
  const user = await getCurrentUser();

  if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
    throw new Error('FORBIDDEN');
  }

  return user;
}
