import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import Invitation from '@/models/Invitation';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import crypto from 'crypto';
import Link from 'next/link';
import AcceptButton from './AcceptButton';
import { Mail, ShieldAlert, UserCheck, AlertTriangle, ArrowRight, LogOut } from 'lucide-react';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await dbConnect();

  // 1. Resolve token and invitation metadata
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invitation = await Invitation.findOne({ tokenHash })
    .populate('invitedBy', 'name')
    .populate('tenantId', 'name');

  // Check if invitation is expired/invalid
  const isExpired = invitation && invitation.expiresAt < new Date();
  if (isExpired && invitation.status === 'PENDING') {
    invitation.status = 'EXPIRED';
    await invitation.save();
  }

  if (!invitation || invitation.status !== 'PENDING' || isExpired) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full text-red-600 dark:text-red-400">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Invitation Invalid</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This invitation link is invalid, has expired, or has already been accepted/cancelled.
            </p>
          </div>
          <div className="w-full border-t border-slate-200 dark:border-slate-800 my-2" />
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Please ask the workspace administrator to send you a new invitation.
          </p>
        </div>
      </main>
    );
  }

  const workspaceName = (invitation.tenantId as unknown as { name: string })?.name ?? 'Workspace';
  const inviterName = (invitation.invitedBy as unknown as { name: string })?.name ?? 'Workspace Administrator';
  const roleLabel = invitation.role === 'ADMIN' ? 'Workspace Admin' : 'Workspace Member';

  const session = await auth();

  // Case 2: Guest / Logged out User
  if (!session?.user?.email) {
    const loginUrl = `/login?email=${encodeURIComponent(invitation.email)}&callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;
    const registerUrl = `/register?email=${encodeURIComponent(invitation.email)}&callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;

    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
          {/* Workspace Invitation Header */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400">
              <Mail className="h-10 w-10 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Workspace Invitation</h2>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Join {workspaceName}</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              <strong>{inviterName}</strong> has invited you to join the workspace as a <strong>{roleLabel}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Invitation sent to:</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{invitation.email}</span>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Link
              href={registerUrl}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={loginUrl}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition duration-200 text-center cursor-pointer"
            >
              Log In
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Please sign up or log in using the email address above to accept this invitation.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const currentUserEmail = session.user.email.toLowerCase().trim();
  const invitationEmail = invitation.email.toLowerCase().trim();

  // Case 3: Logged in as WRONG User (email mismatch)
  if (currentUserEmail !== invitationEmail) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Email Mismatch</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This invitation was sent to <strong className="text-slate-800 dark:text-slate-200">{invitation.email}</strong>, but you are currently signed in as <strong className="text-slate-800 dark:text-slate-200">{currentUserEmail}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
            You must sign out of your current account, then sign in or register with the email address that received the invitation.
          </div>

          {/* Form logout trigger or standard auth signout redirect */}
          <Link
            href="/api/auth/signout?callbackUrl=/invite"
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </main>
    );
  }

  // Case 4: Logged in as correct User, ready to Accept
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 animate-bounce">
            <UserCheck className="h-10 w-10" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Invitation Received</h2>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Join {workspaceName}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            <strong>{inviterName}</strong> has invited you to join the workspace as a <strong>{roleLabel}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Accepting invitation as:</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentUserEmail}</span>
        </div>

        <AcceptButton token={token} workspaceId={invitation.tenantId.toString()} />

        <div className="text-center">
          <p className="text-xs text-slate-500">
            By joining, you will get access to all tasks and project boards in this workspace.
          </p>
        </div>
      </div>
    </main>
  );
}

// Suppress unused imports
void User;
void Tenant;
