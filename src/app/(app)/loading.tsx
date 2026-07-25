import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 font-sans w-full max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800/60 rounded-lg" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 h-28"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/60 rounded" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Big Panel Skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-96 flex flex-col gap-6">
          <div className="border-b border-slate-100 dark:border-slate-800/50 pb-4 flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-600 animate-spin" />
          </div>
        </div>

        {/* Right Side Skeleton Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-48 flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800/50 pb-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800/60 rounded" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
