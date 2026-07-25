import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Membership from '@/models/Membership';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import mongoose from 'mongoose';
import TeamSearchFilter from './TeamSearchFilter';
import TeamList from './TeamList';
import InviteSection from './InviteSection';
import PendingInvitationsList from './PendingInvitationsList';
import { Info, ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface TeamPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, user, role } = context;
  const { q } = await searchParams;
  const searchQuery = q || '';

  await dbConnect();

  // 1. Get the total (unfiltered) active members in this workspace
  const totalTenantMembers = await Membership.countDocuments({
    tenantId: tenant.id,
    status: 'ACTIVE',
  });

  // 2. Resolve users if search filter is applied
  let matchingUserIds: mongoose.Types.ObjectId[] = [];
  const isSearching = searchQuery.trim().length > 0;

  if (isSearching) {
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery.trim(), $options: 'i' } },
        { email: { $regex: searchQuery.trim(), $options: 'i' } },
      ],
    }).select('_id');
    matchingUserIds = users.map((u) => u._id as mongoose.Types.ObjectId);
  }

  // 3. Build query
  const query: Record<string, unknown> = {
    tenantId: tenant.id,
    status: 'ACTIVE',
  };

  if (isSearching) {
    query.userId = { $in: matchingUserIds };
  }

  // 4. Retrieve memberships, populating safe User details
  const memberships = await Membership.find(query)
    .populate('userId', 'name email avatarUrl')
    .sort({ createdAt: 1 });

  // Map to a clean, serializable list
  const serializedMembers = memberships
    .map((m) => {
      const u = m.userId as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        avatarUrl?: string;
      };
      if (!u) return null;
      return {
        id: m._id.toString(),
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
        user: {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl || '',
        },
      };
    })
    .filter((m) => m !== null);

  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  // Fetch pending invitations (OWNER/ADMIN only)
  let serializedInvitations: any[] = [];
  if (isOwnerOrAdmin) {
    const invitations = await Invitation.find({
      tenantId: tenant.id,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name')
      .sort({ createdAt: -1 });

    serializedInvitations = invitations.map((inv) => {
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
  }

  // Helper for role display text
  const getRoleText = (r: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    switch (r) {
      case 'OWNER':
        return 'Workspace Owner';
      case 'ADMIN':
        return 'Workspace Admin';
      case 'MEMBER':
        return 'Workspace Member';
      default:
        return r;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
          Team Management
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View, search, and manage roles and memberships for the{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">{tenant.name}</span> workspace.
        </p>
      </div>

      {/* Info Panel: Current User's Workspace Role Context */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm dark:shadow-md">
        <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Your Active Scope</p>
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
            You are logged in as <span className="font-medium text-slate-900 dark:text-slate-200">{user.name}</span> with role:{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">{getRoleText(role)}</span>
          </p>
        </div>
      </div>

      {/* Search Input Filter */}
      {totalTenantMembers > 0 && <TeamSearchFilter initialSearch={searchQuery} />}

      {/* Invite Member Section (Owner/Admin only) */}
      {isOwnerOrAdmin && <InviteSection workspaceName={tenant.name} />}

      {/* Member Display States */}
      {totalTenantMembers === 0 ? (
        /* Empty Workspace State (Should theoretically not happen since Owner must exist) */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-2xl w-full">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">No active members</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            This workspace has no active members. Please verify database integrity.
          </p>
        </div>
      ) : serializedMembers.length === 0 ? (
        /* Search Empty Results State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-xl w-full">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">No team members found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5 font-sans">
            No team members matched your search text &ldquo;{searchQuery}&rdquo;. Try typing a different query.
          </p>
          <Link
            href="/team"
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
          >
            Clear Search
          </Link>
        </div>
      ) : (
        /* Active Members List */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {totalTenantMembers} {totalTenantMembers === 1 ? 'Member' : 'Members'} in Workspace
            </h3>
          </div>
          <TeamList
            members={serializedMembers}
            currentUserRole={role}
            currentUserId={user.id}
          />
        </div>
      )}

      {/* Pending Invitations Section (Owner/Admin only) */}
      {isOwnerOrAdmin && (
        <div className="flex flex-col gap-4 mt-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pending Invitations
          </h3>
          <PendingInvitationsList invitations={serializedInvitations} />
        </div>
      )}
    </div>
  );
}
