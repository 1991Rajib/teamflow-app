'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Activity,
  AlertTriangle,
  UserX,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function PlatformAdminDashboardOverview({ adminEmail }: { adminEmail: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, activityRes] = await Promise.all([
          fetch('/api/admin/overview'),
          fetch('/api/admin/activity?limit=5'),
        ]);

        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          setMetrics(overviewData.metrics);
        } else {
          setErrorMsg('Unable to load platform overview metrics.');
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.activities || []);
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
        setErrorMsg('Unable to load platform overview.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 font-sans w-full">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"></div>
          <div className="lg:col-span-2 h-64 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (errorMsg || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{errorMsg || 'Unable to load overview.'}</h3>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = metrics;

  return (
    <div className="space-y-8 font-sans text-slate-900 dark:text-slate-100 w-full">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Platform Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Console operator email: <span className="font-medium text-slate-700 dark:text-slate-300">{adminEmail}</span>
          </p>
        </div>
      </div>

      {/* SECTION A — KEY PLATFORM METRICS */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Key Platform Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                Total Users
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {m.totalUsers.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                Total Workspaces
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {m.totalWorkspaces.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                Active Subscriptions
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {m.paidWorkspaces.toLocaleString()}
              </span>
            </div>
          </div>

          {m.totalRevenue > 0 ? (
            <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                  Total Revenue
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${m.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <DollarSign className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No revenue data available yet.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION B — PLATFORM HEALTH / STATUS */}
        <section className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Platform Health</h2>
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Users</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{m.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Workspaces</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{m.activeWorkspaces.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Suspended Users</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{m.suspendedUsers?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Suspended Workspaces</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{m.suspendedWorkspaces.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION C — RECENT ACTIVITY */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Recent Activity</h2>
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition"
            >
              View Full Logs <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-[264px] overflow-y-auto overflow-x-hidden relative">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">No recent platform activity yet.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Platform events will appear here.</p>
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0 border-slate-100 dark:border-slate-800/60">
                    <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {act.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{new Date(act.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        {act.admin && (
                          <>
                            <span>•</span>
                            <span>By: {act.admin.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
