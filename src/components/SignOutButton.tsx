'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition duration-200 cursor-pointer"
    >
      <LogOut className="w-4 h-4 text-slate-400" />
      Sign Out
    </button>
  );
}
