'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface ProjectSearchFilterProps {
  initialSearch: string;
  initialStatus: string;
}

export default function ProjectSearchFilter({
  initialSearch,
  initialStatus,
}: ProjectSearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      updateParams(search, initialStatus);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParams = (newSearch: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch.trim()) {
      params.set('q', newSearch.trim());
    } else {
      params.delete('q');
    }

    if (newStatus && newStatus !== 'ALL') {
      params.set('status', newStatus);
    } else if (newStatus === 'ALL') {
      params.set('status', 'ALL');
    } else {
      params.delete('status');
    }

    router.push(`/projects?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams(search, initialStatus);
  };

  const handleClear = () => {
    setSearch('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm font-sans">
      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex-1 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name or description..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-4 transition duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-200 transition duration-150 outline-none"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Status Filter Toggle */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden md:block">
          Filter:
        </label>
        <select
          id="status-filter"
          value={initialStatus}
          onChange={(e) => updateParams(search, e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 cursor-pointer"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
          <option value="ALL">ALL STATUSES</option>
        </select>
      </div>
    </div>
  );
}
