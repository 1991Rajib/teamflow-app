import { Loader2 } from 'lucide-react';

export default function BillingLoading() {
  return (
    <div className="flex flex-col gap-8 font-sans max-w-7xl mx-auto w-full animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div>
            <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg mb-1.5"></div>
            <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Current Plan Banner Skeleton */}
      <div className="rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center gap-5 shadow-lg bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-800/80">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-1"></div>
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="sm:text-right mt-4 sm:mt-0">
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg sm:ml-auto mb-1"></div>
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded sm:ml-auto"></div>
        </div>
      </div>

      {/* Usage Metrics Skeleton */}
      <section>
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="flex items-end gap-1.5 mt-2">
                <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mb-1"></div>
              </div>
              <div className="w-full mt-2">
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex justify-between mt-1.5">
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Comparison Skeleton */}
      <section>
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-6 border flex flex-col gap-5 shadow-lg bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-800/80">
              <div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-4 w-full max-w-[200px] bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment History Skeleton */}
      <section>
        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
        <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
          <div className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-800/60 p-4 flex">
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="border-b border-slate-200 dark:border-slate-800/40 p-5 flex">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
