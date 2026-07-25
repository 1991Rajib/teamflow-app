import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import Task from '@/models/Task';
import mongoose from 'mongoose';
import Link from 'next/link';
import { ArrowLeft, Edit3, Calendar, Tag, User, ListTodo, ShieldAlert, Plus, Eye, AlertTriangle } from 'lucide-react';
import DeleteProjectButton from './DeleteProjectButton';
import EditButton from '@/components/EditButton';
import { formatDueDate, isOverdue, formatDate } from '@/lib/dateUtils';
import TaskFeedbackActions from '@/components/TaskFeedbackActions';
import Tooltip from '@/components/Tooltip';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { projectId } = await params;

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Invalid Project</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          The requested project ID is invalid or corrupt.
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  await dbConnect();

  // Find project, populated with creator name, scoped exclusively to active tenant (IDOR check)
  const project = await Project.findOne({
    _id: projectId,
    tenantId: tenant.id,
  }).populate('createdBy', 'name');

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Project Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          We couldn&apos;t find the project you were looking for. It may have been deleted, or you might not have access to it.
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // Fetch project-specific tasks sorted by newest first
  const tasks = await Task.find({
    projectId: project._id,
    tenantId: tenant.id,
  })
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });

  // Safely extract creator name
  const creatorName =
    project.createdBy && typeof project.createdBy === 'object' && 'name' in project.createdBy
      ? (project.createdBy as unknown as { name: string }).name
      : 'Unknown User';

  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col gap-6">
        {/* Header section with Name and Actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  project.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Tag className="w-3 h-3" />
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
              {project.name}
            </h1>
          </div>

          {/* Action buttons (OWNER/ADMIN only) */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${project._id.toString()}/edit`}
                className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Edit Project"
                title="Edit Project"
              >
                <Edit3 className="w-4 h-4" />
              </Link>
              <DeleteProjectButton
                projectId={project._id.toString()}
                projectName={project.name}
              />
            </div>
          )}
        </div>

        {/* Project Description */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Description
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {project.description || 'No description provided for this project.'}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5 text-sm">
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5">
            <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Created By</span>
               <span className="text-xs font-medium text-slate-700 dark:text-slate-350 dark:text-slate-300">{creatorName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5">
            <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Date Created</span>
               <span className="text-xs font-medium text-slate-700 dark:text-slate-350 dark:text-slate-300">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5">
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Last Updated</span>
               <span className="text-xs font-medium text-slate-700 dark:text-slate-350 dark:text-slate-300">
                {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Task Management Section */}
        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                <ListTodo className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tasks</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-full text-slate-500 dark:text-slate-400">
                  {tasks.length}
                </span>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <Link
                href={`/tasks/new?projectId=${project._id.toString()}`}
                className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </Link>
            )}
          </div>

          {tasks.length === 0 ? (
            /* Project-specific Empty State */
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-500">
                <ListTodo className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No tasks yet</h4>
                {isOwnerOrAdmin ? (
                  <>
                    <p className="text-xs text-slate-500 max-w-xs mb-3">
                      This project has no tasks. Create your first task to start tracking work.
                    </p>
                    <Link
                      href={`/tasks/new?projectId=${project._id.toString()}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Task
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs">
                    No tasks have been created for this project yet. Tasks will appear here when they are created.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Tasks List */
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <Link
                  key={task._id.toString()}
                  href={`/tasks/${task._id.toString()}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition duration-150 group"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition duration-150 truncate">
                      {task.title}
                    </span>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Assigned to: <strong className="text-slate-700 dark:text-slate-400">{task.assignedTo ? (task.assignedTo as unknown as { name: string }).name : 'Unassigned'}</strong></span>
                      {task.dueDate && (() => {
                        const dueDateStr = task.dueDate instanceof Date
                          ? task.dueDate.toISOString().slice(0, 10)
                          : String(task.dueDate).slice(0, 10);
                        const overdue = isOverdue(dueDateStr, task.status);
                        const formatted = formatDueDate(dueDateStr);
                        return overdue ? (
                          <span
                            className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded"
                            title="Task is overdue"
                            aria-label="Task is overdue"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                            <span>Due: {formatted}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-1.5 py-0.5 rounded"
                            title="Task deadline"
                            aria-label="Task deadline"
                          >
                            <Calendar className="w-2.5 h-2.5 text-slate-500" />
                            <span>Due: {formatted}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                        task.status === 'DONE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                        task.priority === 'HIGH'
                          ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <TaskFeedbackActions
                      taskId={task._id.toString()}
                      taskTitle={task.title}
                      projectName={project.name}
                      assignedMemberName={task.assignedTo ? (task.assignedTo as unknown as { name: string }).name : null}
                      currentUserRole={role}
                    />

                    {isOwnerOrAdmin && (
                      <EditButton href={`/tasks/${task._id.toString()}/edit?callbackUrl=/projects/${project._id.toString()}`} />
                    )}

                    <Tooltip content="View details">
                      <div 
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded" 
                        tabIndex={0}
                        aria-label="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </div>
                    </Tooltip>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
