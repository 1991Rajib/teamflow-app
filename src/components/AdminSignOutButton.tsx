'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function AdminSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:border-red-950/30 dark:text-red-400 text-xs font-semibold transition duration-150 cursor-pointer select-none"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign Out
    </button>
  );
}
