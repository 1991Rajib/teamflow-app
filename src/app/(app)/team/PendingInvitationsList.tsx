'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Trash2, Mail, ShieldAlert, Check, AlertTriangle, Copy } from 'lucide-react';
import dayjs from 'dayjs';

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  invitedByName: string;
}

interface PendingInvitationsListProps {
  invitations: Invitation[];
}

export default function PendingInvitationsList({ invitations }: PendingInvitationsListProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  // Modal confirm state
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleResend = async (id: string, email: string) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Failed to resend invitation.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Invitation resent successfully to ${email}.`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async (id: string) => {
    setServerError(null);
    setSuccessMessage(null);
    setCopyingId(id);

    try {
      const response = await fetch(`/api/invitations/${id}/link`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Failed to generate invitation link.');
        setCopyingId(null);
        return;
      }

      await navigator.clipboard.writeText(data.url);
      setSuccessMessage('Invitation link copied!');
      
      // Reset the copy icon after 2 seconds
      setTimeout(() => setCopyingId(null), 2000);
      
      // We don't need to router.refresh() because the expiration and visible data hasn't changed.
    } catch (err) {
      console.error(err);
      setServerError('Unable to copy invitation link. Please try again.');
      setCopyingId(null);
    }
  };

  const handleCancelClick = (invite: Invitation) => {
    setSelectedInvite(invite);
    setIsConfirmOpen(true);
    setServerError(null);
    setSuccessMessage(null);
  };

  const confirmCancel = async () => {
    if (!selectedInvite) return;
    setIsSubmitting(true);
    setServerError(null);
    setIsConfirmOpen(false);

    try {
      const response = await fetch(`/api/invitations/${selectedInvite.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Failed to cancel invitation.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Successfully cancelled invitation for ${selectedInvite.email}.`);
      setSelectedInvite(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center shadow-sm dark:shadow-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast Alerts */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-450 dark:text-emerald-400 text-sm px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2 animate-fade-in">
          <ShieldAlert className="w-4 h-4" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Desktop view: Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/35">
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Invited Email</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Role</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Invited By</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Expiration Date</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {invitations.map((invite) => {
              const daysLeft = dayjs(invite.expiresAt).diff(dayjs(), 'day');
              const expirationText = daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired';

              return (
                <tr key={invite.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition duration-150">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{invite.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                      invite.role === 'ADMIN'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-500/10 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{invite.invitedByName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                      PENDING
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-sans">
                    {dayjs(invite.expiresAt).format('MM/DD/YYYY')} ({expirationText})
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyLink(invite.id)}
                        disabled={isSubmitting || copyingId === invite.id}
                        title="Copy Invitation Link"
                        aria-label="Copy invitation link"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copyingId === invite.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleResend(invite.id, invite.email)}
                        disabled={isSubmitting}
                        title="Resend Invitation"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelClick(invite)}
                        disabled={isSubmitting}
                        title="Cancel Invitation"
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view: Stacked List */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {invitations.map((invite) => {
          const daysLeft = dayjs(invite.expiresAt).diff(dayjs(), 'day');
          const expirationText = daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired';

          return (
            <div key={invite.id} className="bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{invite.email}</span>
                  <span className="text-[10px] text-slate-500">Invited by {invite.invitedByName}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  invite.role === 'ADMIN'
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-500/10 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {invite.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-850 pt-2 text-slate-500 dark:text-slate-400 font-sans">
                <span>Expires: {dayjs(invite.expiresAt).format('MM/DD/YYYY')}</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">{expirationText}</span>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => handleCopyLink(invite.id)}
                  disabled={isSubmitting || copyingId === invite.id}
                  aria-label="Copy invitation link"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {copyingId === invite.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleResend(invite.id, invite.email)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resend
                </button>
                <button
                  onClick={() => handleCancelClick(invite)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-500/25 bg-white dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog for cancelling invitation */}
      {isConfirmOpen && selectedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-white dark:bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl flex flex-col gap-4 z-10 text-slate-800 dark:text-slate-100 antialiased">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <h3 className="text-lg font-semibold">Cancel Invitation?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Are you sure you want to cancel the invitation for <strong className="text-slate-800 dark:text-slate-200">{selectedInvite.email}</strong>? They will not be able to use the link to join the workspace.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
