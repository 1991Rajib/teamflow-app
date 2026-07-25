export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-6 font-sans max-w-7xl mx-auto w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
      </div>

      {/* Filter Skeleton */}
      <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm animate-pulse">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mt-1"></div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-4">
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
