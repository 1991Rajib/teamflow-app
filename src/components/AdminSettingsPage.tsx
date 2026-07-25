'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Loader2,
  Mail,
  Sliders,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    platformName: 'TeamFlow',
    supportEmail: 'support@teamflow.com',
    allowRegistrations: true,
    allowNewWorkspaces: true,
    sessionTimeout: 120,
    requireMfa: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load platform settings config on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'System configuration saved successfully.' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected network error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2 font-sans text-slate-900 dark:text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <span className="text-xs text-slate-450">Retrieving system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            System Settings
          </h1>
          <p className="text-xs text-slate-400">
            Configure platform parameters, user registration controls, and system-level security policies
          </p>
        </div>
      </div>

      {/* Message feedback alerts */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-455" /> General Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-350">Platform Branding Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleInputChange('platformName', e.target.value)}
                required
                className="bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl py-2 px-4 text-xs text-slate-900 dark:text-white focus:outline-none transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-350">Customer Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 dark:text-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-455" /> System Feature Flags
          </h3>

          <div className="divide-y divide-slate-200 text-xs">
            {/* Allow registration toggle */}
            <div className="py-4 flex items-center justify-between">
              <div className="space-y-0.5 max-w-lg">
                <span className="font-bold text-slate-900 dark:text-white block">Allow Customer Registrations</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Toggle platform sign-up controls. When deactivated, new user registrations are temporarily locked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowRegistrations')}
                className="text-slate-400 focus:outline-none transition"
              >
                {settings.allowRegistrations ? (
                  <ToggleRight className="w-10 h-10 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>

            {/* Allow new workspaces toggle */}
            <div className="py-4 flex items-center justify-between">
              <div className="space-y-0.5 max-w-lg">
                <span className="font-bold text-slate-900 dark:text-white block">Allow Workspace Creations</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Allow members to build new workspaces. When disabled, workspace onboarding and creation endpoints are blocked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowNewWorkspaces')}
                className="text-slate-400 focus:outline-none transition"
              >
                {settings.allowNewWorkspaces ? (
                  <ToggleRight className="w-10 h-10 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-455" /> Platform Security Policy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-350">Admin Session Lifetime (Minutes)</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-4 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-rose-500"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
                <option value={240}>240 Minutes (4 Hours)</option>
              </select>
            </div>

            <div className="flex items-center justify-between border border-slate-200 dark:border-slate-900 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">Enforce Admin MFA</span>
                <p className="text-[10px] text-slate-550">Requires Multi-Factor Authentication checks for console logins.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('requireMfa')}
                className="focus:outline-none transition animate-pulse"
              >
                {settings.requireMfa ? (
                  <ToggleRight className="w-10 h-10 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-900 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
