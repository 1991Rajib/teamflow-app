import { Loader2 } from 'lucide-react';

export default function WorkspaceSettingsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse select-none font-sans w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div>
        </div>
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="flex flex-row lg:flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 lg:w-full"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
        </div>
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
            <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
            <div className="space-y-1.5 md:col-span-2"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
            <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
            <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
