'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Zap, X } from 'lucide-react';

interface BillingStatusProps {
  planCode: 'FREE' | 'PRO';
  isOwner: boolean;
}

type BannerType = 'success' | 'canceled' | null;

export default function BillingStatus({ planCode, isOwner }: BillingStatusProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Compute initial banner state from URL params synchronously (avoids useEffect + setState)
  const initialBanner = useMemo<BannerType>(() => {
    const session = searchParams.get('session');
    if (session === 'success') return 'success';
    if (session === 'canceled') return 'canceled';
    return null;
  }, [searchParams]);

  const [banner, setBanner] = useState<BannerType>(initialBanner);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const dismissBanner = useCallback(() => {
    setBanner(null);
    // Remove the query param from the URL without a full page reload
    router.replace('/billing', { scroll: false });
  }, [router]);

  const handleUpgrade = useCallback(async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setUpgradeError(data.message || 'Unable to start checkout. Please try again.');
        return;
      }

      if (data.url) {
        // Redirect to Stripe Checkout hosted page
        window.location.href = data.url;
      }
    } catch {
      setUpgradeError('A network error occurred. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  }, [isUpgrading]);

  return (
    <div className="flex flex-col gap-4">
      {/* Success Banner */}
      {banner === 'success' && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 animate-fade-in"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Upgrade successful!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Your workspace has been upgraded to Pro. All limits are now unlocked.
            </p>
          </div>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss success notification"
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canceled Banner */}
      {banner === 'canceled' && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 animate-fade-in"
        >
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Checkout canceled</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              No changes were made. You can upgrade at any time.
            </p>
          </div>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss canceled notification"
            className="text-amber-600 hover:text-amber-750 dark:text-amber-400 dark:hover:text-amber-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upgrade Error */}
      {upgradeError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 animate-fade-in"
        >
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm flex-1">{upgradeError}</p>
          <button
            onClick={() => setUpgradeError(null)}
            aria-label="Dismiss error"
            className="text-red-600 hover:text-red-750 dark:text-red-400 dark:hover:text-red-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upgrade Button — only shown to OWNER on FREE plan */}
      {isOwner && planCode === 'FREE' && (
        <button
          id="upgrade-to-pro-btn"
          onClick={handleUpgrade}
          disabled={isUpgrading}
          aria-busy={isUpgrading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white font-semibold text-sm shadow-lg shadow-indigo-900/30 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isUpgrading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Redirecting to checkout…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" aria-hidden="true" />
              Upgrade to Pro — $15/month
            </>
          )}
        </button>
      )}
    </div>
  );
}
