import { Loader2 } from 'lucide-react';

export default function TeamLoading() {
  return (
    <div className="flex flex-col gap-6 font-sans max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg mt-1"></div>
      </div>

      {/* Info Panel Skeleton */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>

      {/* Search Input Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-sm">
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      {/* Invite Member Section Skeleton */}
      <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 w-full max-w-xl">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl self-stretch md:self-auto flex-shrink-0"></div>
      </div>

      {/* Members List Header Skeleton */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        
        {/* Table Skeleton */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/10">
          <div className="h-12 w-full bg-slate-50 dark:bg-slate-900/35 border-b border-slate-200 dark:border-slate-800"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full w-1/6"></div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
              <div className="flex justify-end gap-2 w-1/6">
                <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile List Skeleton */}
        <div className="md:hidden flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
