'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Users,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function SubscriptionsAdminPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ currentPage: 1, totalPages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Filters & query states
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
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

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        q: search,
        status,
      });

      const res = await fetch(`/api/admin/subscriptions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, limit: 10 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [page, status]);


  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 w-full">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Platform Subscriptions
          </h1>
          <p className="text-xs text-slate-405">
            Global overview of billing mappings, plans, Stripe subscription reference IDs, and period dates
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
              placeholder="Search by workspace, owner name/email..."
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
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-550" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIALING">Trialing</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
              <option value="INCOMPLETE">Incomplete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-slate-450">Retrieving subscriptions data...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-semibold">
            No subscriptions found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 dark:bg-slate-950/60 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  <th className="py-4 px-6">Workspace</th>
                  <th className="py-4 px-6">Owner</th>
                  <th className="py-4 px-6">Active Plan</th>
                  <th className="py-4 px-6">Stripe Subscription Info</th>
                  <th className="py-4 px-6">Period End</th>
                  <th className="py-4 px-6">Billing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-4 px-6">
                      <Link
                        href={`/admin/workspaces/${sub.workspace.id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        {sub.workspace.name} <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="block text-[10px] text-slate-550">Status: {sub.workspace.status}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="block font-medium text-slate-800 dark:text-slate-200">{sub.owner.name}</span>
                      <span className="block text-[10px] text-slate-550">{sub.owner.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        sub.plan.code === 'PRO' 
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' 
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {sub.plan.code}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1">${sub.plan.price} / {sub.plan.billingInterval}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[10px] space-y-1">
                      {sub.stripeSubscriptionId ? (
                        <>
                          <span className="block text-slate-700 dark:text-slate-350 select-all">Sub: {sub.stripeSubscriptionId}</span>
                          <span className="block text-slate-550 select-all">Cust: {sub.stripeCustomerId}</span>
                        </>
                      ) : (
                        <span className="text-slate-550 italic">Internal free billing mapper</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-450">
                      {sub.currentPeriodEnd ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-550" />
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-550 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : sub.status === 'TRIALING'
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                          : sub.status === 'CANCELED'
                          ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : sub.status === 'TRIALING'
                            ? 'bg-blue-500'
                            : sub.status === 'CANCELED'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}></span>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 dark:bg-slate-950/60 p-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} subscriptions)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
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
