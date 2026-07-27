'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

export function MobileNav({ hasSession }: { hasSession: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="lg:hidden flex items-center gap-4">
      <ThemeSwitcher />
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full h-[calc(100vh-5rem)] bg-white dark:bg-[#070a13] z-40 overflow-y-auto border-t border-slate-100 dark:border-slate-800/50 shadow-2xl">
          <div className="flex flex-col px-6 py-8 gap-6 text-lg font-semibold text-slate-900 dark:text-white">
            <Link href="#features" onClick={closeMenu} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</Link>
            <Link href="#how-it-works" onClick={closeMenu} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">How it Works</Link>
            <Link href="#pricing" onClick={closeMenu} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing</Link>
            <Link href="#faq" onClick={closeMenu} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">FAQ</Link>
            
            <hr className="border-slate-100 dark:border-slate-800" />
            
            {hasSession ? (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="text-center py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-4">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="text-center py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="text-center py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
