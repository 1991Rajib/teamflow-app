'use client';

import { Shield, Sparkles } from 'lucide-react';

interface PlatformAdminDashboardPlaceholderProps {
  adminEmail: string;
}

export default function PlatformAdminDashboardPlaceholder({ adminEmail }: PlatformAdminDashboardPlaceholderProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center font-sans">
      <div className="w-full max-w-xl p-8 bg-slate-900/40 border border-slate-850 rounded-2xl shadow-xl text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="w-8 h-8 text-white" />
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Admin Dashboard</h1>
          <p className="text-xs text-slate-405">
            You are logged in as <span className="font-semibold text-rose-400">{adminEmail}</span>
          </p>
        </div>

        <div className="border-t border-slate-850/60 pt-6">
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            This is the initial foundation layout of the TeamFlow SaaS Platform Administration console. Navigation placeholders are visible on the left sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
