import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import { getTenantSubscription } from '@/lib/subscription';
import NewProjectForm from './NewProjectForm';
import { ShieldAlert, AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';

export default async function NewProjectPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { role, tenant } = context;

  // Authorization Check
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Only organization Owners and Admins are permitted to create new projects in this workspace.
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  await dbConnect();

  // ── Plan Limit Checks (Server-side gating) ──
  const currentProjectCount = await Project.countDocuments({
    tenantId: tenant.id,
    status: 'ACTIVE',
  });

  const { limits, planCode } = await getTenantSubscription(tenant.id);
  const isOwner = role === 'OWNER';

  if (limits.maxProjects !== -1 && currentProjectCount >= limits.maxProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 bg-amber-500/5 border border-amber-500/25 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Project Limit Reached</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          Your workspace has reached the project limit of <span className="font-medium text-slate-800 dark:text-slate-200">{limits.maxProjects}</span> on the <span className="font-medium text-slate-800 dark:text-slate-200">{planCode === 'PRO' ? 'Pro Plan' : 'Free Plan'}</span>.
        </p>
        {planCode === 'FREE' && isOwner ? (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link
              href="/billing"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-violet-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/15"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro for Unlimited
            </Link>
            <Link
              href="/projects"
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition underline font-medium"
            >
              Back to Projects
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500 max-w-xs font-medium">
              Please contact the workspace Owner to upgrade the subscription plan.
            </p>
            <Link
              href="/projects"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition duration-200 outline-none"
            >
              Back to Projects
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Create New Project</h2>
        <p className="text-sm text-slate-400">
          Set up a new workspace project to group and organize your tasks.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <NewProjectForm />
      </div>
    </div>
  );
}
