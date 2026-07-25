import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import mongoose from 'mongoose';
import Link from 'next/link';
import { ArrowLeft, Edit3, Calendar, Tag, User, ShieldAlert, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDate, formatDueDate, isOverdue } from '@/lib/dateUtils';
import DeleteTaskButton from './DeleteTaskButton';
import TaskCommentsSection from '@/components/TaskCommentsSection';

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { taskId } = await params;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Invalid Task</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          The requested task ID is invalid or corrupt.
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

  // Find task, populated with project and membership info, scoped exclusively to active tenant
  const task = await Task.findOne({
    _id: taskId,
    tenantId: tenant.id,
  })
    .populate('projectId', 'name tenantId')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name');

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Task Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          We couldn&apos;t find the task you were looking for. It may have been deleted, or you might not have access to it.
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

  // Cross-tenant verification: Ensure task's project belongs to user's active tenant
  const project = task.projectId as unknown as { _id: string; name: string; tenantId: { toString(): string } };
  if (!project || project.tenantId.toString() !== tenant.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Workspace Mismatch</h2>
        <p className="text-sm text-slate-505 dark:text-slate-400 max-w-sm mb-6">
          The task belongs to a project outside your active workspace. Access has been denied.
        </p>
        <Link
          href="/tasks"
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-202 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Tasks
        </Link>
      </div>
    );
  }

  const creatorName = task.createdBy && (task.createdBy as unknown as { name: string }).name ? (task.createdBy as unknown as { name: string }).name : 'Unknown User';
  const assigneeName = task.assignedTo && (task.assignedTo as unknown as { name: string }).name ? (task.assignedTo as unknown as { name: string }).name : 'Unassigned';
  const assigneeEmail = task.assignedTo && (task.assignedTo as unknown as { email: string }).email ? `(${(task.assignedTo as unknown as { email: string }).email})` : '';

  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      {/* Navigation */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tasks
        </Link>
      </div>

      {/* Detail Block */}
      <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col gap-6">
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  task.status === 'DONE'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Tag className="w-3 h-3" />
                {task.status}
              </span>

              {/* Priority Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  task.priority === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    : task.priority === 'MEDIUM'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {task.priority} Priority
              </span>

              {/* Due Date & Overdue Warning */}
              {task.dueDate && (() => {
                const dueDateStr = task.dueDate instanceof Date
                  ? task.dueDate.toISOString().slice(0, 10)
                  : String(task.dueDate).slice(0, 10);
                const overdue = isOverdue(dueDateStr, task.status);
                const formatted = formatDueDate(dueDateStr);
                return overdue ? (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                    title="Task is overdue"
                    aria-label="Task is overdue"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span>Due: {formatted}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/55 text-slate-700 dark:text-slate-300"
                    title="Task deadline"
                    aria-label="Task deadline"
                  >
                    <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-500" />
                    <span>Due: {formatted}</span>
                  </span>
                );
              })()}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
              {task.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Project: <Link href={`/projects/${project._id.toString()}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline underline-offset-2">{project.name}</Link>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <>
                <Link
                  href={`/tasks/${task._id.toString()}/edit`}
                  className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Edit Task"
                  title="Edit Task"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <DeleteTaskButton
                  taskId={task._id.toString()}
                  taskTitle={task.title}
                />
              </>
            )}
          </div>
        </div>

        {/* Task Description */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Description
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No description provided for this task.'}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5 text-sm">
          <div className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-[#0f172a]/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5">
            <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Assigned To</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={`${assigneeName} ${assigneeEmail}`}>
                {assigneeName} <span className="text-[10px] text-slate-500 font-normal">{assigneeEmail}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-[#0f172a]/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5">
            <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Date Created</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                {formatDate(task.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-[#0f172a]/20 border border-slate-200 dark:border-slate-800/40 rounded-xl p-3.5">
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Last Updated</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                {formatDate(task.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2 mt-2 bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850/50 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>Created by <strong className="text-slate-700 dark:text-slate-300">{creatorName}</strong>. This task is currently scoped under the project &quot;{project.name}&quot; inside your active workspace context.</span>
        </div>
      </div>

      {/* Embedded Comments Section */}
      <TaskCommentsSection taskId={task._id.toString()} />
    </div>
  );
}
