'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
export default function AdminSetupPage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setSession(data);
            setStatus('authenticated');
          } else {
            setSession(null);
            setStatus('unauthenticated');
          }
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      } catch {
        setSession(null);
        setStatus('unauthenticated');
      }
    }
    loadSession();
  }, []);

  const handlePromote = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Promotion request failed.');
      }

      setSuccessMsg(data.message || 'Success! Your account has been promoted to Platform Admin.');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during bootstrap setup.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] text-slate-100 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4 font-sans text-slate-100">
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Authentication Required</h1>
          <p className="text-xs text-slate-400">
            You must be logged in as a normal user first to run the bootstrap process.
          </p>
          <Link
            href="/login?callbackUrl=/admin/setup"
            className="inline-block w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Sign In to Continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Shield className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-black tracking-tight text-white">Platform Setup</h1>
          <p className="text-xs text-slate-450">TeamFlow Admin One-Time Setup Bootstrap</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="leading-relaxed font-semibold">{successMsg}</p>
              <p className="text-[10px] text-slate-400">
                Please log out and sign back in from the dedicated admin login page to refresh your access token privileges.
              </p>
            </div>
          </div>
        )}

        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Logged In As:</span>
            <span className="text-slate-200 font-semibold">{session.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Email Identity:</span>
            <span className="text-slate-200 font-semibold font-mono">{session.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Platform Role:</span>
            <span className="text-slate-350 uppercase font-semibold">{session.user?.platformRole || 'USER'}</span>
          </div>
        </div>

        {!successMsg && (
          <button
            onClick={handlePromote}
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
          >
            {loading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
            Promote to Platform Admin
          </button>
        )}

        {successMsg && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                fetch('/api/auth/signout', { method: 'POST' }).then(() => {
                  window.location.href = '/admin';
                });
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-200 font-semibold text-xs rounded-xl transition text-center cursor-pointer select-none"
            >
              Sign Out & Go to Admin Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
