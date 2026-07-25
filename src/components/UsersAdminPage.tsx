'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from 'lucide-react';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ currentPage: 1, totalPages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Filters & query states
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        q: search,
        role,
        status,
      });

      const res = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, limit: 10 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, role, status]);


  // Toggle user account suspension status
  const toggleSuspension = async (user: any) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? `Suspend account for user '${user.name}' (${user.email})? They will be locked out from accessing the application immediately.`
        : `Reactivate account for user '${user.name}'?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.message || 'Action failed.');
      }
    } catch {
      alert('Network error occurred.');
    }
  };

  // Promote / Demote platform role
  const toggleRole = async (user: any) => {
    const newRole = user.platformRole === 'PLATFORM_ADMIN' ? 'USER' : 'PLATFORM_ADMIN';
    const confirmMsg =
      newRole === 'PLATFORM_ADMIN'
        ? `Promote user '${user.name}' to Platform Administrator?`
        : `Demote administrator '${user.name}' to a normal customer?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformRole: newRole }),
      });

      if (res.ok) {
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.message || 'Action failed.');
      }
    } catch {
      alert('Network error occurred.');
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 w-full">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Platform Users
          </h1>
          <p className="text-xs text-slate-400">
            Directory of accounts, platform authorization controls, and suspensions
          </p>
        </div>
      </div>

      {/* Filters control toolbar */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-2 w-full lg:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg py-1.5 pl-9 pr-10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                title="Clear search"
                aria-label="Clear search query"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Platform Role filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Platform Roles</option>
              <option value="USER">USER</option>
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
            </select>
          </div>

          {/* Status filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Retrieving users directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
            No matching users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-6">Platform Role</th>
                  <th className="py-4 px-6">Workspaces Membership</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-4 px-6">
                      <span className="block font-bold text-slate-900 dark:text-white">{u.name}</span>
                      <span className="block text-[10px] text-slate-500">{u.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.platformRole === 'PLATFORM_ADMIN'
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.platformRole}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {u.workspaces.length === 0 ? (
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 italic">No workspaces</span>
                        ) : (
                          u.workspaces.map((ws: any) => (
                            <Link
                              key={ws.id}
                              href={`/admin/workspaces/${ws.id}`}
                              className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
                            >
                              {ws.name} ({ws.role})
                            </Link>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/admin/users/${u.id}`}
                          title="View user details"
                          aria-label={`View user details for ${u.name}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleRole(u)}
                          title={u.platformRole === 'PLATFORM_ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                          aria-label={u.platformRole === 'PLATFORM_ADMIN' ? `Demote ${u.name} to User` : `Promote ${u.name} to Admin`}
                          className="p-1.5 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-rose-300 rounded-lg bg-rose-50 hover:bg-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleSuspension(u)}
                          title={u.status === 'SUSPENDED' ? 'Reactivate account' : 'Suspend account'}
                          aria-label={u.status === 'SUSPENDED' ? `Reactivate ${u.name}` : `Suspend ${u.name}`}
                          className={`p-1.5 rounded-lg border transition ${
                            u.status === 'SUSPENDED'
                              ? 'text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 hover:bg-emerald-500 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/20'
                              : 'text-amber-600 hover:text-white dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 hover:bg-amber-500 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border-amber-200 dark:border-amber-500/20'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} users)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                aria-label="Next page"
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
