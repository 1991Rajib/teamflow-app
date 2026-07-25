'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

interface AcceptButtonProps {
  token: string;
  workspaceId: string;
}

export default function AcceptButton({ token, workspaceId }: AcceptButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to accept invitation.');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      // Set active workspace cookie so AppLayout connects immediately
      document.cookie = `activeTenantId=${workspaceId}; path=/; max-age=31536000; SameSite=Lax; Secure`;

      // Redirect user to workspace dashboard after a short success pause
      setTimeout(() => {
        router.replace('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-10 w-10 animate-bounce" />
        <span className="font-semibold">Invitation Accepted! Redirecting...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Joining Workspace...
          </>
        ) : (
          'Accept Invitation & Join Workspace'
        )}
      </button>
    </div>
  );
}
