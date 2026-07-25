'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  ArrowLeft,
  Lock,
  Unlock,
  Shield,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface WorkspaceDetailsAdminPageProps {
  id: string;
}

export default function WorkspaceDetailsAdminPage({ id }: WorkspaceDetailsAdminPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${id}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load details.');
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const toggleSuspension = async () => {
    const ws = data?.workspace;
    if (!ws) return;

    const newStatus = ws.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? `Suspend workspace '${ws.name}'? Members will be blocked from accessing their dashboard.`
        : `Reactivate workspace '${ws.name}'?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/workspaces/${ws.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadDetails();
      } else {
        const err = await res.json();
        alert(err.message || 'Status update failed.');
      }
    } catch {
      alert('Network error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-8 bg-slate-200 dark:bg-slate-900/50 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-slate-100 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-850 animate-pulse"></div>
          <div className="h-[400px] bg-slate-100 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-850 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center font-sans">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-550">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Access Error</h2>
          <p className="text-xs text-slate-404 max-w-sm">
            {error || 'The requested workspace details could not be retrieved.'}
          </p>
        </div>
        <Link
          href="/admin/workspaces"
          className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Workspaces
        </Link>
      </div>
    );
  }

  const { workspace, owner, members, projects, tasks, subscription, usage } = data;

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 font-sans">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/workspaces"
            className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {workspace.name}
            </h1>
            <p className="text-xs text-slate-400">
              Workspace ID: <span className="font-mono text-slate-500">{workspace.id}</span>
            </p>
          </div>
        </div>

        {/* Quick Suspension Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSuspension}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer select-none ${
              workspace.status === 'SUSPENDED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-950 hover:border-emerald-800'
                : 'bg-amber-500/10 text-amber-400 border-amber-950 hover:border-amber-800'
            }`}
          >
            {workspace.status === 'SUSPENDED' ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Reactivate Workspace
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Suspend Workspace
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main workspace information cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meta Profile Card */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3">
              Workspace Profile Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-550 font-medium">Workspace Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">{workspace.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-550 font-medium">Slug URL</span>
                <p className="font-semibold text-slate-900 dark:text-white font-mono">{workspace.slug}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-550 font-medium">Owner</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {owner.name} <span className="text-slate-550 font-normal">({owner.email})</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Creation Date</span>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-550" />
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              </div>
              {workspace.website && (
                <div className="space-y-1">
                  <span className="text-slate-550 font-medium">Website</span>
                  <a
                    href={workspace.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-rose-455 hover:underline flex items-center gap-1 w-fit"
                  >
                    {workspace.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {workspace.industry && (
                <div className="space-y-1">
                  <span className="text-slate-550 font-medium">Industry / Segment</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{workspace.industry}</p>
                </div>
              )}
              {workspace.timezone && (
                <div className="space-y-1">
                  <span className="text-slate-550 font-medium">Timezone</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{workspace.timezone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Members Directory */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center justify-between">
              <span>Active Members ({members.length})</span>
              <Users className="w-4 h-4 text-slate-550" />
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5">User Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Workspace Role</th>
                    <th className="py-2.5 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-900/60">
                  {members.map((member: any) => (
                    <tr key={member.membershipId} className="hover:bg-slate-50 dark:hover:bg-slate-900/5">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{member.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-355">{member.email}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.role === 'OWNER'
                            ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                            : member.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-550">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Projects List */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center justify-between">
              <span>Projects ({projects.length})</span>
              <FolderKanban className="w-4 h-4 text-slate-555" />
            </h3>

            {projects.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No projects created yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-900/60">
                {projects.map((proj: any) => (
                  <div key={proj.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{proj.name}</h4>
                      <p className="text-[10px] text-slate-550 truncate max-w-md">
                        {proj.description || 'No description provided'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      proj.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar subscription & usage columns */}
        <div className="space-y-6">
          {/* Usage statistics card */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3">
              Workspace Metrics
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400">Total Members</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{usage.membersCount}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-slate-550" />
                  <span className="text-xs text-slate-400">Active Projects</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{usage.projectsCount}</span>
              </div>

              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400">Task Backlog Count</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{usage.tasksCount}</span>
              </div>
            </div>
          </div>

          {/* Subscription details card */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3">
              Subscription Plan Info
            </h3>

            {subscription ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-555 font-medium">Billing Plan</span>
                  <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      subscription.plan.code === 'PRO' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/25 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {subscription.plan.code}
                    </span>
                    <span className="text-slate-400">${subscription.plan.price} / {subscription.plan.billingInterval}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-555 font-medium">Subscription Status</span>
                  <p className="font-semibold text-slate-900 dark:text-white uppercase">{subscription.status}</p>
                </div>

                {subscription.stripeSubscriptionId && (
                  <div className="space-y-1">
                    <span className="text-slate-555 font-medium">Stripe Sub ID</span>
                    <p className="font-mono text-[10px] text-slate-400 truncate select-all">{subscription.stripeSubscriptionId}</p>
                  </div>
                )}

                {subscription.currentPeriodEnd && (
                  <div className="space-y-1">
                    <span className="text-slate-555 font-medium">Renews/Expires On</span>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-550" />
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-4 text-xs font-semibold">
                No subscription document found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
