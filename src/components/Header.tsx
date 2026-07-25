'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import UserMenu from '@/components/UserMenu';
import NotificationBell from '@/components/NotificationBell';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface HeaderProps {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantLogo?: string;
  platformRole?: 'USER' | 'PLATFORM_ADMIN';
  userName: string;
  userEmail: string;
}

export default function Header({
  currentTenantId,
  currentTenantName,
  currentTenantLogo,
  platformRole,
  userName,
  userEmail,
}: HeaderProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Derive readable page title from current path segment
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const primarySegment = segments[0];
    return primarySegment.charAt(0).toUpperCase() + primarySegment.slice(1);
  };

  // Close mobile drawer on Escape keydown
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <header className={`border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur-lg px-6 py-4 flex items-center justify-between flex-shrink-0 relative transition duration-150 ${isMobileOpen ? 'z-50' : 'z-30'}`}>
      {/* Left section: mobile hamburger trigger or page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right section: user credentials & menu settings */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{userName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
        </div>
        <ThemeSwitcher />
        <NotificationBell />
        <UserMenu userName={userName} userEmail={userEmail} currentTenantLogo={currentTenantLogo} />
      </div>

      {/* Mobile Drawer ( Radix-like slide out sheet panel ) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Drawer drawer content block */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {/* Close button inside mobile drawer */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Sidebar component wrapper */}
            <Sidebar
              currentTenantId={currentTenantId}
              currentTenantName={currentTenantName}
              currentTenantLogo={currentTenantLogo}
              platformRole={platformRole}
              userName={userName}
              userEmail={userEmail}
              className="h-full border-r-0"
              onLinkClick={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
