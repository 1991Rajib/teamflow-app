'use client';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  currentTenantLogo?: string;
}

export default function UserMenu({ userName, userEmail, currentTenantLogo }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative font-sans" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User profile settings menu"
        className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-500/20 hover:border-blue-400/40 hover:bg-blue-600/20 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 uppercase transition duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 overflow-hidden"
      >
        {currentTenantLogo ? (
          <img src={currentTenantLogo} className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
            <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 font-medium"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Settings
          </Link>

          <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-500/10 transition outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 cursor-pointer font-medium"
          >
            <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
