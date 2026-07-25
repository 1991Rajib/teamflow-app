'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface TaskSearchFilterProps {
  initialSearch: string;
  initialStatus: string;
  initialPriority: string;
  initialProjectId: string;
  projects: { id: string; name: string }[];
}

export default function TaskSearchFilter({
  initialSearch,
  initialStatus,
  initialPriority,
  initialProjectId,
  projects,
}: TaskSearchFilterProps) {
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
      updateParams(search, initialStatus, initialPriority, initialProjectId);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParams = (newSearch: string, newStatus: string, newPriority: string, newProjectId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch.trim()) {
      params.set('q', newSearch.trim());
    } else {
      params.delete('q');
    }

    if (newStatus && newStatus !== 'ALL') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }

    if (newPriority && newPriority !== 'ALL') {
      params.set('priority', newPriority);
    } else {
      params.delete('priority');
    }

    if (newProjectId && newProjectId !== 'ALL') {
      params.set('projectId', newProjectId);
    } else {
      params.delete('projectId');
    }

    router.push(`/tasks?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams(search, initialStatus, initialPriority, initialProjectId);
  };

  const handleClear = () => {
    setSearch('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.push(`/tasks?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm font-sans">
      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-4 transition duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition duration-150 outline-none"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Select Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {/* Project filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="project-select" className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden lg:block">
            Project:
          </label>
          <select
            id="project-select"
            value={initialProjectId}
            onChange={(e) => updateParams(search, initialStatus, initialPriority, e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 cursor-pointer h-9"
          >
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-select" className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden lg:block">
            Status:
          </label>
          <select
            id="status-select"
            value={initialStatus}
            onChange={(e) => updateParams(search, e.target.value, initialPriority, initialProjectId)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 cursor-pointer h-9"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="priority-select" className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden lg:block">
            Priority:
          </label>
          <select
            id="priority-select"
            value={initialPriority}
            onChange={(e) => updateParams(search, initialStatus, e.target.value, initialProjectId)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 cursor-pointer h-9"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>
    </div>
  );
}
