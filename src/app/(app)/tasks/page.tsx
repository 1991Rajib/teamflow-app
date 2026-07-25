import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Link from 'next/link';
import { ListTodo, Plus, Calendar, Folder, User, CheckCircle2, Eye, AlertTriangle } from 'lucide-react';
import TaskSearchFilter from './TaskSearchFilter';
import EditButton from '@/components/EditButton';
import { formatDueDate, isOverdue, formatDate } from '@/lib/dateUtils';
import TaskFeedbackActions from '@/components/TaskFeedbackActions';
import Tooltip from '@/components/Tooltip';

interface TasksPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    projectId?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { q, status, priority, projectId } = await searchParams;

  const searchQuery = q || '';
  const statusFilter = status || 'ALL';
  const priorityFilter = priority || 'ALL';
  const projectFilter = projectId || 'ALL';

  await dbConnect();

  // 1. Get active projects to filter related tasks
  const activeProjects = await Project.find({ tenantId: tenant.id, status: 'ACTIVE' }).sort({ name: 1 });
  const activeProjectIds = activeProjects.map((p) => p._id);
  const totalTenantProjects = activeProjects.length;

  // 2. Get total task count for active projects to manage general empty states
  const totalTenantTasks = await Task.countDocuments({
    tenantId: tenant.id,
    projectId: { $in: activeProjectIds },
  });

  // 3. Build tenant-scoped query with active filters
  const query: Record<string, unknown> = {
    tenantId: tenant.id,
    projectId: { $in: activeProjectIds },
  };

  if (searchQuery.trim()) {
    query.$or = [
      { title: { $regex: searchQuery.trim(), $options: 'i' } },
      { description: { $regex: searchQuery.trim(), $options: 'i' } },
    ];
  }

  if (statusFilter !== 'ALL') {
    query.status = statusFilter;
  }

  if (priorityFilter !== 'ALL') {
    query.priority = priorityFilter;
  }

  // Secure project boundary verification for project filtering
  if (projectFilter !== 'ALL') {
    const isProjectActive = activeProjects.some((p) => p._id.toString() === projectFilter);
    if (isProjectActive) {
      query.projectId = projectFilter;
    } else {
      // If project doesn't belong to tenant or is archived, fallback to unqueryable
      query.projectId = new mongoose.Types.ObjectId();
    }
  }

  // 4. Retrieve tasks matching query
  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  // 5. Populate the filter dropdown using active projects
  const serializableProjects = activeProjects.map((p) => ({
    id: p._id.toString(),
    name: p.name,
  }));

  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 dark:text-slate-200 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
            Tasks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View, track progress, and organize task items in the <span className="font-medium text-slate-700 dark:text-slate-300">{tenant.name}</span> workspace.
          </p>
        </div>

        {isOwnerOrAdmin && totalTenantProjects > 0 && totalTenantTasks > 0 && (
          <Link
            href="/tasks/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Link>
        )}
      </div>

      {/* Show search filter panel if tasks exist */}
      {totalTenantTasks > 0 && (
        <TaskSearchFilter
          initialSearch={searchQuery}
          initialStatus={statusFilter}
          initialPriority={priorityFilter}
          initialProjectId={projectFilter}
          projects={serializableProjects}
        />
      )}

      {/* Render states */}
      {totalTenantProjects === 0 ? (
        /* Project Required State */
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-5">
            <Folder className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Create a Project First</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
            Every task in TeamFlow must be associated with a project. Please create your first project before creating tasks.
          </p>
          {isOwnerOrAdmin && (
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          )}
        </div>
      ) : totalTenantTasks === 0 ? (
        /* Empty Workspace State */
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-5">
            <ListTodo className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">No tasks yet</h3>
          {isOwnerOrAdmin ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                Your workspace has no tasks yet. Set up your first task to start tracking progress, assigning tasks to members, and managing priorities.
              </p>
              <Link
                href="/tasks/new"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" />
                Create Your First Task
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              No tasks have been created in this workspace yet. Check back once your workspace Owner or Admin assigns a task.
            </p>
          )}
        </div>
      ) : tasks.length === 0 ? (
        /* Filter Empty Results State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">No tasks found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5 font-sans">
            No tasks matched your current search filters. Try resetting the filters or typing a different query.
          </p>
          <Link
            href="/tasks"
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
          >
            Clear Filters & Search
          </Link>
        </div>
      ) : (
        /* Tasks List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id.toString()}
              className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm transition duration-200 relative overflow-hidden"
            >
              <div className="flex flex-col gap-2.5">
                {/* Badges metadata */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        task.status === 'DONE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>

                    {/* Priority badge */}
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        task.priority === 'HIGH'
                          ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* Date Created */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatDate(task.createdAt)}</span>
                  </div>
                </div>

                {/* Task Title & Project */}
                <div>
                  <Link href={`/tasks/${task._id.toString()}`} className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition duration-150 truncate inline-block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                    {task.title}
                  </Link>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Project: <span className="text-slate-600 dark:text-slate-400">{task.projectId ? (task.projectId as unknown as { name: string }).name : 'Unassigned'}</span>
                  </span>
                </div>

                {/* Due Date & Overdue Warning */}
                {task.dueDate && (() => {
                  const dueDateStr = task.dueDate instanceof Date
                    ? task.dueDate.toISOString().slice(0, 10)
                    : String(task.dueDate).slice(0, 10);
                  const overdue = isOverdue(dueDateStr, task.status);
                  const formatted = formatDueDate(dueDateStr);
                  return (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold">
                      {overdue ? (
                        <span
                          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md"
                          title="Task is overdue"
                          aria-label="Task is overdue"
                        >
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>Due: {formatted}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-2 py-0.5 rounded-md"
                          title="Task deadline"
                          aria-label="Task deadline"
                        >
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Due: {formatted}</span>
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Description Preview */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Footer info: assignee and details link */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 text-[10px] font-semibold text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate text-slate-600 dark:text-slate-400">
                    {task.assignedTo ? (task.assignedTo as unknown as { name: string }).name : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TaskFeedbackActions
                    taskId={task._id.toString()}
                    taskTitle={task.title}
                    projectName={task.projectId ? (task.projectId as unknown as { name: string }).name : 'Unassigned'}
                    assignedMemberName={task.assignedTo ? (task.assignedTo as unknown as { name: string }).name : null}
                    currentUserRole={role}
                  />
                  <Tooltip content="View details">
                    <Link 
                      href={`/tasks/${task._id.toString()}`}
                      className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded" 
                      tabIndex={0}
                      aria-label="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </Tooltip>
                  {isOwnerOrAdmin && (
                    <EditButton href={`/tasks/${task._id.toString()}/edit?callbackUrl=/tasks`} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import mongoose from 'mongoose';
