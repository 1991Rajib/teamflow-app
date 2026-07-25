'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Building2,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export default function WorkspacesAdminPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ currentPage: 1, totalPages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);

  // Deletion state
  const [deletingWorkspace, setDeletingWorkspace] = useState<any>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput, search]);

  // Load Workspaces list
  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        q: search,
        plan,
        status,
        sort,
      });

      const res = await fetch(`/api/admin/workspaces?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, limit: 10 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [page, search, plan, status, sort]);

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Status Action (Suspend / Reactivate)
  const toggleSuspension = async (workspace: any) => {
    const newStatus = workspace.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? `Are you sure you want to suspend the workspace '${workspace.name}'? Members will be blocked from access.`
        : `Reactivate workspace '${workspace.name}'?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadWorkspaces();
      } else {
        const err = await res.json();
        alert(err.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    }
  };

  // Danger delete
  const executeDelete = async () => {
    if (deleteConfirmName !== deletingWorkspace.name) {
      alert('Workspace name does not match confirmation.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${deletingWorkspace.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingWorkspace(null);
        setDeleteConfirmName('');
        setPage(1);
        loadWorkspaces();
      } else {
        const err = await res.json();
        alert(err.message || 'Deletion failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 w-full">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Platform Workspaces
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit, suspend, reactivate, or delete TeamFlow tenant organizations
          </p>
        </div>
      </div>

      {/* Filters control toolbar */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full lg:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search by workspace, owner name/email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-lg py-1.5 pl-9 pr-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                title="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Plan filter */}
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Plans</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workspaces Table Section */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Fetching workspaces data...</span>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
            No matching workspaces found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Workspace Name</th>
                  <th className="py-4 px-6">Owner</th>
                  <th className="py-4 px-6 text-center">Members</th>
                  <th className="py-4 px-6 text-center">Projects</th>
                  <th className="py-4 px-6 text-center">Tasks</th>
                  <th className="py-4 px-6">Plan</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {workspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {ws.name}
                      <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Slug: {ws.slug}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="block font-medium text-slate-800 dark:text-slate-200">{ws.owner.name}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ws.owner.email}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-700 dark:text-slate-300">{ws.memberCount}</td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-700 dark:text-slate-300">{ws.projectCount}</td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-700 dark:text-slate-300">{ws.taskCount}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        ws.plan === 'PRO' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {ws.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ws.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : ws.status === 'SUSPENDED'
                          ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                          : ws.status === 'ARCHIVED'
                          ? 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ws.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : ws.status === 'SUSPENDED'
                            ? 'bg-red-500'
                            : ws.status === 'ARCHIVED'
                            ? 'bg-slate-500'
                            : 'bg-amber-500'
                        }`}></span>
                        {ws.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/admin/workspaces/${ws.id}`}
                          title="Inspect details"
                          aria-label={`Inspect details for ${ws.name}`}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleSuspension(ws)}
                          title={ws.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                          aria-label={ws.status === 'SUSPENDED' ? `Reactivate ${ws.name}` : `Suspend ${ws.name}`}
                          className={`p-1.5 rounded-lg border bg-white dark:bg-slate-900 transition ${
                            ws.status === 'SUSPENDED'
                              ? 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800'
                              : 'text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800'
                          }`}
                        >
                          {ws.status === 'SUSPENDED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeletingWorkspace(ws)}
                          title="Delete workspace"
                          aria-label={`Delete ${ws.name}`}
                          className="p-1.5 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} workspaces)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                aria-label="Next page"
                className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workspace deletion Confirmation Modal */}
      {deletingWorkspace && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-red-900/30 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
              <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Delete Workspace?</h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You are about to permanently delete <strong className="text-slate-900 dark:text-white">{deletingWorkspace.name}</strong>.
              </p>
              <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 p-3 rounded-lg text-[11px] text-red-700 dark:text-red-400 leading-normal">
                <span className="font-bold">CRITICAL WARNING:</span> This operation is highly destructive and cannot be undone. All workspace projects, tasks, comments, files, memberships, and Stripe mappings will be permanently wiped from the database.
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Please type <span className="font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 font-bold border border-slate-200 dark:border-slate-800">{deletingWorkspace.name}</span> below to confirm deletion:
              </p>
              <input
                type="text"
                placeholder="Type workspace name exactly..."
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-red-500 rounded-xl py-2 px-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition"
              />
            </div>

            <div className="flex gap-3 pt-2">
               <button
                onClick={() => {
                  setDeletingWorkspace(null);
                  setDeleteConfirmName('');
                }}
                disabled={isDeleting}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting || deleteConfirmName !== deletingWorkspace.name}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer select-none"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
