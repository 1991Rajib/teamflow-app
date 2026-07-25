import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';
import EditTaskForm from './EditTaskForm';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditTaskPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { taskId } = await params;

  // Authorization Check: Only OWNER and ADMIN can edit tasks
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Only organization Owners and Admins are permitted to edit tasks in this workspace.
        </p>
        <Link
          href={`/tasks/${taskId}`}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Task Details
        </Link>
      </div>
    );
  }

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-900/20 border border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
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

  // Find task, verifying it belongs strictly to active tenant (IDOR prevention)
  const task = await Task.findOne({
    _id: taskId,
    tenantId: tenant.id,
  });

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-900/20 border border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">Task Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          We couldn&apos;t find the task you were looking for. It may have been deleted, or you might not have access to it.
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

  // Fetch projects and team members inside this tenant boundaries
  const [projects, memberships] = await Promise.all([
    Project.find({ tenantId: tenant.id }).sort({ name: 1 }),
    Membership.find({ tenantId: tenant.id, status: 'ACTIVE' }).populate('userId', 'name email'),
  ]);

  const teamMembers = memberships
    .map((m) => {
      const user = m.userId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };
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

  const serializableTask = {
    id: task._id.toString(),
    title: task.title,
    description: task.description || '',
    projectId: task.projectId.toString(),
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo ? task.assignedTo.toString() : '',
    // Serialize dueDate as "YYYY-MM-DD" — EditTaskForm expects this format
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : '',
  };

  return (
    <div className="max-w-2xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      <div>
        <Link
          href={`/tasks/${serializableTask.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Details
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Edit Task</h2>
        <p className="text-sm text-slate-500">
          Modify task name, details, active project board, priority status, or assignee.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <EditTaskForm
          task={serializableTask}
          projects={serializableProjects}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
