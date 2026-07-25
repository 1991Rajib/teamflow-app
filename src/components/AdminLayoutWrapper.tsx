import { requirePlatformAdmin } from '@/lib/admin-auth';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
} from 'lucide-react';
import React from 'react';
import AdminSignOutButton from '@/components/AdminSignOutButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { AdminSidebarNav, AdminMobileNav } from '@/components/AdminNav';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default async function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  // Validate that user is PLATFORM_ADMIN before rendering the console shell
  const user = await requirePlatformAdmin();



  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Platform Admin Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex-shrink-0 h-full">
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-md shadow-rose-900/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Platform Admin</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">TeamFlow Console</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <AdminSidebarNav />

        {/* Footer switcher, profile & logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 space-y-4">
          <div className="flex justify-center">
            <ThemeSwitcher />
          </div>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-150 cursor-pointer select-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to App
          </Link>

          {/* Profile Details */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center font-bold text-rose-600 dark:text-rose-455">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{user.name || 'Admin'}</span>
              <span className="block text-[10px] text-slate-500 truncate">{user.email}</span>
            </div>
          </div>

          {/* Client-side Sign-Out */}
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between px-4 flex-shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-wide uppercase">Console</span>
          </div>

          <div className="flex gap-1.5 items-center">
            <AdminMobileNav />
            <Link
              href="/dashboard"
              title="Return to App"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition border border-slate-200 dark:border-slate-850"
            >
              <ArrowLeft className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </Link>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-[#090d19]">
          {children}
        </main>
      </div>
    </div>
  );
}
