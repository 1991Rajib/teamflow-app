'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Calendar,
  Building2,
  ArrowLeft,
  Briefcase,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface UserDetailsAdminPageProps {
  id: string;
}

export default function UserDetailsAdminPage({ id }: UserDetailsAdminPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
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

  // Toggle user account suspension status
  const toggleSuspension = async () => {
    const u = data?.user;
    if (!u) return;

    const newStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? `Suspend account for user '${u.name}' (${u.email})? They will be locked out immediately.`
        : `Reactivate user '${u.name}'?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
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

  // Promote / Demote admin credentials
  const toggleRole = async () => {
    const u = data?.user;
    if (!u) return;

    const newRole = u.platformRole === 'PLATFORM_ADMIN' ? 'USER' : 'PLATFORM_ADMIN';
    const confirmMsg =
      newRole === 'PLATFORM_ADMIN'
        ? `Promote user '${u.name}' to Platform Administrator?`
        : `Demote administrator '${u.name}' to normal user?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformRole: newRole }),
      });

      if (res.ok) {
        loadDetails();
      } else {
        const err = await res.json();
        alert(err.message || 'Platform role update failed.');
      }
    } catch {
      alert('Network error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-8 bg-slate-900/50 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-slate-900/30 rounded-xl border border-slate-850 animate-pulse"></div>
          <div className="h-[350px] bg-slate-900/30 rounded-xl border border-slate-850 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center font-sans">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-550">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Access Error</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            {error || 'The requested user details could not be retrieved.'}
          </p>
        </div>
        <Link
          href="/admin/users"
          className="text-xs font-bold text-rose-455 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Users
        </Link>
      </div>
    );
  }

  const { user, workspaces } = data;

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {user.name}
            </h1>
            <p className="text-xs text-slate-404">
              User ID: <span className="font-mono text-slate-500">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Quick status actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="px-4 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-rose-900/35 hover:bg-slate-50 text-slate-700 dark:text-slate-200 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            {user.platformRole === 'PLATFORM_ADMIN' ? 'Demote to USER' : 'Promote to PLATFORM_ADMIN'}
          </button>

          <button
            onClick={toggleSuspension}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer select-none ${
              user.status === 'SUSPENDED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-950 hover:border-emerald-800'
                : 'bg-red-500/10 text-red-400 border-red-950 hover:border-red-800'
            }`}
          >
            {user.status === 'SUSPENDED' ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Reactivate Account
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Suspend Account
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User profile info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3">
              User Profile Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Full Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Email Address</span>
                <p className="font-semibold text-slate-900 dark:text-white select-all">{user.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Platform Role</span>
                <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    user.platformRole === 'PLATFORM_ADMIN' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400'
                  }`}>
                    {user.platformRole}
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Account Status</span>
                <p className="font-semibold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-450' : 'bg-red-450'}`}></span>
                  {user.status}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-555 font-medium">Registered Date</span>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-555" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Workspace memberships list */}
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center justify-between">
              <span>Workspace Memberships ({workspaces.length})</span>
              <Briefcase className="w-4 h-4 text-slate-550" />
            </h3>

            {workspaces.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-xs">This user has not joined any workspaces.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-900/60">
                {workspaces.map((ws: any) => (
                  <div key={ws.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/workspaces/${ws.id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-rose-455 hover:underline flex items-center gap-1"
                      >
                        {ws.name} <ChevronRight className="w-3 h-3" />
                      </Link>
                      <p className="text-[10px] text-slate-500">
                        Joined: {new Date(ws.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ws.role === 'OWNER'
                          ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-405'
                      }`}>
                        {ws.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ws.status === 'ACTIVE' ? 'bg-emerald-500/5 text-emerald-450' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500'
                      }`}>
                        {ws.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats sidebar */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3">
            Overview Summary
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-slate-400">
            <p>
              Platform user <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span> currently has access to <span className="font-semibold text-slate-900 dark:text-white">{workspaces.length}</span> workspaces.
            </p>
            <p>
              Administrators can promote accounts to grant platform-level privileges or suspend accounts to restrict platform access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
