'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CircleDollarSign,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function RevenueAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue?page=${page}&limit=10`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, [page]);

  if (loading && !data) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-8 bg-slate-200 dark:bg-slate-900/50 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-850 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const r = data?.revenue || {
    mrr: 0,
    arr: 0,
    arpu: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    totalRevenue: 0,
    successfulPaymentsCount: 0,
    failedPaymentsCount: 0,
  };

  const payments = data?.payments || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 };

  const cards = [
    {
      title: 'Monthly Recurring Revenue (MRR)',
      value: `$${r.mrr.toLocaleString()}`,
      desc: 'Active subscriptions monthly value',
      icon: TrendingUp,
      color: 'text-emerald-450',
    },
    {
      title: 'Annual Run-Rate (ARR)',
      value: `$${r.arr.toLocaleString()}`,
      desc: 'MRR multiplied by 12 months',
      icon: TrendingUp,
      color: 'text-blue-450',
    },
    {
      title: 'Average Revenue Per Tenant (ARPU)',
      value: `$${r.arpu.toLocaleString()}`,
      desc: 'MRR / Total active workspaces',
      icon: CircleDollarSign,
      color: 'text-purple-400',
    },
    {
      title: 'Revenue This Month',
      value: `$${r.revenueThisMonth.toLocaleString()}`,
      desc: 'Invoice metrics for current calendar month',
      icon: CreditCard,
      color: 'text-rose-455',
    },
    {
      title: 'Revenue Last Month',
      value: `$${r.revenueLastMonth.toLocaleString()}`,
      desc: 'Metrics for previous calendar month',
      icon: CreditCard,
      color: 'text-slate-400',
    },
    {
      title: 'Cumulative Total Revenue',
      value: `$${r.totalRevenue.toLocaleString()}`,
      desc: 'Accumulated total platform revenue',
      icon: CircleDollarSign,
      color: 'text-amber-450',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 font-sans">
      {/* Title and Environment Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Revenue Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Platform recurring revenue logs, MRR metrics, and Stripe billing invoices
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          Test Mode / Development Data
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-800 transition flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</h3>
                <p className="text-[10px] text-slate-550 leading-normal">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment History Invoices Table */}
      <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden shadow-lg space-y-4">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Stripe Invoice Payments History
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-slate-450">Retrieving payments list...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-semibold">
            No historical invoices recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 dark:bg-slate-950/60 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  <th className="py-4 px-6">Workspace</th>
                  <th className="py-4 px-6">Payment Reference ID</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Processor</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:text-slate-300">
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{payment.workspaceName}</td>
                    <td className="py-4 px-6 font-mono text-[10px] text-slate-600 dark:text-slate-455 select-all">
                      {payment.providerPaymentId || 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      ${payment.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500 uppercase">{payment.currency}</span>
                    </td>
                    <td className="py-4 px-6 uppercase text-[10px] text-slate-450">{payment.provider}</td>
                    <td className="py-4 px-6 text-slate-550">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        payment.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {payment.status}
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
            <span className="text-[10px] text-slate-550 uppercase tracking-wider font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} invoices)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
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
