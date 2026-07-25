'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function AnalyticsAdminPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch(`/api/admin/activity?page=${activityPage}&limit=10`),
      ]);

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (activitiesRes.ok) {
        const actData = await activitiesRes.json();
        setActivities(actData.activities || []);
        setPagination(actData.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activityPage]);

  if (loading && !analytics) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-8 bg-slate-200 dark:bg-slate-900/50 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-slate-100 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-850 animate-pulse"></div>
          <div className="h-[350px] bg-slate-100 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-850 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const trend = analytics?.trend || [];
  const plans = analytics?.plansDistribution || [];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 font-sans">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Platform Analytics & Audit
          </h1>
          <p className="text-xs text-slate-400">
            Platform registrations velocity graphs, subscription share distributions, and security audit log events
          </p>
        </div>
      </div>

      {/* Charts & Splits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom SVG line chart for Workspace and User growth */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" /> Workspace & User Growth Trend
          </h3>

          {trend.length === 0 ? (
            <p className="text-slate-500 text-center py-20 text-xs">No historical trend data available.</p>
          ) : (
            <div className="space-y-6">
              {/* SVG growth lines visualization */}
              <div className="h-44 w-full bg-slate-50 dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-850 rounded-xl p-4 flex items-end justify-between relative">
                <div className="absolute top-3 left-4 text-[9px] text-slate-500">
                  Cumulative Growth (Last 6 Months)
                </div>
                {trend.map((t: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex items-end justify-center gap-1.5 h-28">
                      {/* Users bar */}
                      <div
                        style={{ height: `${Math.max(10, Math.min(100, (t.cumulativeUsers / Math.max(1, trend[trend.length - 1].cumulativeUsers)) * 100))}%` }}
                        className="w-2.5 bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t shadow-md"
                        title={`Users: ${t.cumulativeUsers}`}
                      ></div>
                      {/* Workspaces bar */}
                      <div
                        style={{ height: `${Math.max(10, Math.min(100, (t.cumulativeWorkspaces / Math.max(1, trend[trend.length - 1].cumulativeWorkspaces)) * 100))}%` }}
                        className="w-2.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t shadow-md"
                        title={`Workspaces: ${t.cumulativeWorkspaces}`}
                      ></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-505">{t.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-fuchsia-500"></div>
                  <span className="text-slate-400">Platform Users Growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-505"></div>
                  <span className="text-slate-400">Workspace Tenant registrations</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plan Shares & status columns */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center justify-between">
            <span>Billing Plans Shares</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </h3>

          <div className="space-y-4">
            {plans.map((p: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.value}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(0, Math.min(100, (p.value / Math.max(1, plans.reduce((a: number, b: any) => a + b.value, 0))) * 100))}%` }}
                    className={`h-full rounded-full ${idx === 0 ? 'bg-slate-500' : 'bg-rose-500'}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Security Audit Log events */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden shadow-lg space-y-4">
        <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" /> Platform Security & Audit Logging
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md font-medium uppercase tracking-wider">
            Immutable Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-slate-450">Retrieving audit activity logs...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-semibold">
            No audit logs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 dark:bg-slate-950/60 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  <th className="py-4 px-6">Event Type</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Operator Admin</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-202 divide-slate-200 text-slate-700 dark:text-slate-350">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-4 px-6 font-semibold">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                        act.activityType.includes('SUSPEND') || act.activityType.includes('CANCEL') || act.activityType.includes('DELETE')
                          ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      }`}>
                        {act.activityType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-900 dark:text-white font-medium max-w-md break-words">
                      {act.description}
                    </td>
                    <td className="py-4 px-6">
                      {act.admin ? (
                        <>
                          <span className="block font-semibold text-slate-800 dark:text-slate-200">{act.admin.name}</span>
                          <span className="block text-[9px] text-slate-550">{act.admin.email}</span>
                        </>
                      ) : (
                        <span className="text-slate-555 italic">System / Automation</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(act.timestamp).toLocaleString()}
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
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} events)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                disabled={activityPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivityPage(Math.min(pagination.totalPages, activityPage + 1))}
                disabled={activityPage === pagination.totalPages}
                className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
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
