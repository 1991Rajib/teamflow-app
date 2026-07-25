'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  CircleDollarSign,
  TrendingUp,
  Settings,
} from 'lucide-react';

const navigationItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Revenue', href: '/admin/revenue', icon: CircleDollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
        Administration
      </div>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin' 
          ? pathname === '/admin' 
          : pathname.startsWith(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition duration-150 ${
              isActive
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 shadow-sm border border-rose-100 dark:border-rose-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-transparent font-medium'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin' 
          ? pathname === '/admin' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`p-2 rounded-lg transition ${
              isActive
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
          </Link>
        );
      })}
    </>
  );
}
