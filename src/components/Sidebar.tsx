'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, ListTodo, Users, CreditCard, Settings, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';
import TenantSwitcher from '@/components/TenantSwitcher';

interface SidebarProps {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantLogo?: string;
  platformRole?: 'USER' | 'PLATFORM_ADMIN';
  userName: string;
  userEmail: string;
  className?: string;
  onLinkClick?: () => void;
}

export const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({
  currentTenantId,
  currentTenantName,
  currentTenantLogo,
  platformRole,
  userName,
  userEmail,
  className = '',
  onLinkClick,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full relative transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} ${className}`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-6 items-center justify-center w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full z-50 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-transform hover:scale-110 outline-none"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header / Brand */}
      <div className={`py-5 flex items-center border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base flex-shrink-0">
            TF
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TeamFlow</span>}
        </div>
      </div>

      {/* Switcher Context */}
      <div className={`py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${isCollapsed ? 'px-2' : 'px-5'}`}>
        <TenantSwitcher
          currentTenantId={currentTenantId}
          currentTenantName={currentTenantName}
          currentTenantLogo={currentTenantLogo}
          onSwitch={onLinkClick}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Nav Links */}
      <nav className={`flex-1 py-4 flex flex-col gap-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {platformRole === 'PLATFORM_ADMIN' && (
          <Link
            href="/admin"
            title={isCollapsed ? "Platform Admin" : undefined}
            className={`flex items-center mb-2 rounded-lg text-sm font-semibold transition duration-200 border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 ${
              isCollapsed ? 'justify-center p-2.5 gap-0' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            {!isCollapsed && "Platform Admin"}
          </Link>
        )}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isCollapsed ? 'justify-center p-2.5 gap-0' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info footer for Desktop sidebar */}
      <div className={`py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 flex-shrink-0 flex items-center justify-between ${
        isCollapsed ? 'flex-col gap-4 px-2' : 'gap-3 px-5'
      }`}>
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {currentTenantLogo ? (
            <img src={currentTenantLogo} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 uppercase flex-shrink-0">
              {userName.charAt(0)}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer flex-shrink-0 ${
            isCollapsed ? 'w-full flex justify-center' : ''
          }`}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
