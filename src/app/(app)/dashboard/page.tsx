import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Membership from '@/models/Membership';
import User from '@/models/User';
import { getTenantSubscription } from '@/lib/subscription';
import { isUnlimited } from '@/config/plans';
import {
  FolderKanban,
  ListTodo,
  Users,
  Award,
  Plus,
  ArrowRight,
  Activity,
  AlertTriangle,
  Zap,
  Crown,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import mongoose from 'mongoose';

export default async function DashboardPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, user, role } = context;
  const isOwner = role === 'OWNER';

  await dbConnect();

  const activeProjects = await Project.find({ tenantId: tenant.id, status: 'ACTIVE' }, '_id');
  const activeProjectIds = activeProjects.map((p) => p._id);

  const [projectCount, taskCount, memberCount, subInfo, recentTasks] = await Promise.all([
    Project.countDocuments({ tenantId: tenant.id, status: 'ACTIVE' }),
    Task.countDocuments({
      tenantId: tenant.id,
      status: { $in: ['TODO', 'IN_PROGRESS'] },
      projectId: { $in: activeProjectIds },
    }),
    Membership.countDocuments({ tenantId: tenant.id, status: 'ACTIVE' }),
    getTenantSubscription(tenant.id),
    Task.find({
      tenantId: tenant.id,
      projectId: { $in: activeProjectIds },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name image')
      .lean(),
  ]);

  const { subscription, planCode, limits } = subInfo;
  const planName = planCode === 'PRO' ? 'Pro Plan' : 'Free Plan';
  const subStatus = subscription?.status || 'ACTIVE';

  const tasksGrouped = await Task.aggregate([
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenant.id),
        projectId: { $in: activeProjectIds },
      },
    },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);
  const maxTasksInAProject =
    tasksGrouped.length > 0 ? Math.max(...tasksGrouped.map((t) => t.count)) : 0;

  const warnings: string[] = [];
  const limitReachedList: string[] = [];

  if (!isUnlimited(limits.maxProjects)) {
    if (projectCount >= limits.maxProjects) limitReachedList.push('projects');
    else if (projectCount >= 0.8 * limits.maxProjects) warnings.push('projects');
  }
  if (!isUnlimited(limits.maxMembers)) {
    if (memberCount >= limits.maxMembers) limitReachedList.push('members');
    else if (memberCount >= 0.8 * limits.maxMembers) warnings.push('members');
  }
  if (!isUnlimited(limits.maxTasksPerProject)) {
    if (maxTasksInAProject >= limits.maxTasksPerProject) limitReachedList.push('tasks');
    else if (maxTasksInAProject >= 0.8 * limits.maxTasksPerProject) warnings.push('tasks');
  }

  const isLimitReached = limitReachedList.length > 0;
  const isApproachingLimit = warnings.length > 0;

  return (
    <div className="flex flex-col gap-8 font-sans max-w-7xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
          Welcome back, {user.name}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here is a summary of activity in the <span className="font-medium text-slate-700 dark:text-slate-300">{tenant.name}</span> workspace.
        </p>
      </div>

      {/* ── Limit Warnings Banners ── */}
      {isLimitReached ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 animate-fade-in text-sm font-medium">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">You&apos;ve reached your plan limit.</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                You have reached the maximum allowed count of {limitReachedList.join(', ')} on the {planName}.
              </p>
            </div>
          </div>
          {planCode === 'FREE' && isOwner && (
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition flex-shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Link>
          )}
        </div>
      ) : isApproachingLimit ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 animate-fade-in text-sm font-medium">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">You are approaching your plan limit.</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Your workspace is nearing the limits for {warnings.join(', ')} on the {planName}.
              </p>
            </div>
          </div>
          {planCode === 'FREE' && isOwner && (
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition flex-shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Link>
          )}
        </div>
      ) : null}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">{projectCount}</span>
              <span className="text-xs text-slate-400">/ {isUnlimited(limits.maxProjects) ? '∞' : limits.maxProjects}</span>
            </div>
            {!isUnlimited(limits.maxProjects) && (
              <div className="w-full mt-2.5">
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${projectCount >= limits.maxProjects ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((projectCount / limits.maxProjects) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">{taskCount}</span>
              <span className="text-xs text-slate-400">active ({maxTasksInAProject}/{isUnlimited(limits.maxTasksPerProject) ? '∞' : limits.maxTasksPerProject} per project)</span>
            </div>
            {!isUnlimited(limits.maxTasksPerProject) && (
              <div className="w-full mt-2.5">
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${maxTasksInAProject >= limits.maxTasksPerProject ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((maxTasksInAProject / limits.maxTasksPerProject) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Members Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Members</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">{memberCount}</span>
              <span className="text-xs text-slate-400">/ {isUnlimited(limits.maxMembers) ? '∞' : limits.maxMembers}</span>
            </div>
            {!isUnlimited(limits.maxMembers) && (
              <div className="w-full mt-2.5">
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${memberCount >= limits.maxMembers ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((memberCount / limits.maxMembers) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Plan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {planCode === 'PRO' ? <Crown className="w-4 h-4" /> : <Award className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200 uppercase">{planName}</span>
            <span
              className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                subStatus === 'ACTIVE'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : subStatus === 'PAST_DUE'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-650 text-slate-600 dark:text-slate-300'
              }`}
            >
              {subStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Recent Tasks</h3>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No recent tasks</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                    Tasks created or updated recently will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentTasks.map((task: any) => (
                  <Link key={task._id.toString()} href={`/tasks/${task._id.toString()}`} className="p-4 flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {task.status.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span>Priority: {task.priority}</span>
                        {task.projectId?.name && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">Project: {task.projectId.name}</span>
                          </>
                        )}
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                        {task.assignedTo?.name && (
                          <>
                            <span>•</span>
                            <span>Assigned: {task.assignedTo.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-transparent group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions & Workspace Info */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/50 pb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/projects"
                className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Go to Projects
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition duration-200" />
              </Link>

              <Link
                href="/tasks"
                className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="flex items-center gap-2.5">
                  <ListTodo className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  Go to Tasks
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition duration-200" />
              </Link>

              <Link
                href="/team"
                className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  View Team Members
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition duration-200" />
              </Link>
            </div>
          </div>

          {/* Workspace Details Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/50 pb-3">
              Workspace Scope
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Active Role</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium uppercase">{role}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Workspace ID</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 truncate">{tenant.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Slug Scope</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">{tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
