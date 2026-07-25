import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Membership from '@/models/Membership';
import NewTaskForm from './NewTaskForm';
import { getTenantSubscription } from '@/lib/subscription';
import { ShieldAlert, AlertTriangle, Zap, Plus } from 'lucide-react';
import Link from 'next/link';

interface NewTaskPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { projectId } = await searchParams;

  // Authorization Check: Only OWNER and ADMIN can create tasks
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Only organization Owners and Admins are permitted to create new tasks in this workspace.
        </p>
        <Link
          href="/tasks"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Tasks
        </Link>
      </div>
    );
  }

  await dbConnect();

  // 1. Fetch all projects in this workspace to select from
  const projects = await Project.find({ tenantId: tenant.id }).sort({ name: 1 });

  // If no projects exist, require the user to create a project first
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-white dark:bg-[#1e293b]/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Create a Project First</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          Tasks must belong to a project. Since your workspace has no projects, you must set one up before creating tasks.
        </p>
        {role === 'OWNER' || role === 'ADMIN' ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        ) : (
          <p className="text-xs text-slate-500">
            Ask an Owner or Admin to create a project.
          </p>
        )}
      </div>
    );
  }

  // ── Plan Limit Checks (Server-side task limit block for specified project) ──
  const { limits, planCode } = await getTenantSubscription(tenant.id);
  const isOwner = role === 'OWNER';

  if (projectId && limits.maxTasksPerProject !== -1) {
    const projectTasksCount = await Task.countDocuments({
      tenantId: tenant.id,
      projectId,
    });

    if (projectTasksCount >= limits.maxTasksPerProject) {
      const targetProject = projects.find((p) => p._id.toString() === projectId);
      const projectName = targetProject ? targetProject.name : 'this project';

      return (
        <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 bg-amber-500/5 border border-amber-500/25 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Task Limit Reached</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
            The project <span className="font-medium text-slate-800 dark:text-slate-200">{projectName}</span> has reached the task limit of <span className="font-medium text-slate-800 dark:text-slate-200">{limits.maxTasksPerProject}</span> tasks on the <span className="font-medium text-slate-800 dark:text-slate-200">{planCode === 'PRO' ? 'Pro Plan' : 'Free Plan'}</span>.
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
                href={projectId ? `/projects/${projectId}` : '/tasks'}
                className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 dark:hover:text-slate-300 transition underline font-medium"
              >
                Back
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-500 max-w-xs font-medium">
                Please contact the workspace Owner to upgrade the subscription plan.
              </p>
              <Link
                href={projectId ? `/projects/${projectId}` : '/tasks'}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition duration-200 outline-none"
              >
                Back
              </Link>
            </div>
          )}
        </div>
      );
    }
  }

  // 2. Fetch active team members to populate the assignedTo dropdown
  const memberships = await Membership.find({
    tenantId: tenant.id,
    status: 'ACTIVE',
  }).populate('userId', 'name email');

  const teamMembers = memberships
    .map((m) => {
      const user = m.userId as unknown as { _id: { toString(): string }; name: string; email: string };
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };
    })
    .filter((user): user is { id: string; name: string; email: string } => !!user);

  const serializableProjects = projects.map((p) => ({
    id: p._id.toString(),
    name: p.name,
  }));

  return (
    <div className="max-w-2xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Create New Task</h2>
        <p className="text-sm text-slate-400">
          Add a task to a project and assign it to a team member in the workspace.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl">
        <NewTaskForm
          projects={serializableProjects}
          teamMembers={teamMembers}
          initialProjectId={projectId || ''}
        />
      </div>
    </div>
  );
}
