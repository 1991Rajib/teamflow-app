import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import mongoose from 'mongoose';
import EditProjectForm from './EditProjectForm';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { projectId } = await params;

  // Authorization Check
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Only organization Owners and Admins are permitted to edit projects in this workspace.
        </p>
        <Link
          href={`/projects/${projectId}`}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Project Details
        </Link>
      </div>
    );
  }

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-900/20 border border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
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

  // Find project, verifying it belongs strictly to active tenant (IDOR check)
  const project = await Project.findOne({
    _id: projectId,
    tenantId: tenant.id,
  });

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-slate-900/20 border border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Project Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          We couldn't find the project you were looking for. It may have been deleted, or you might not have access to it.
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

  // Map database document to serializable properties
  const serializableProject = {
    id: project._id.toString(),
    name: project.name,
    description: project.description || '',
    status: project.status,
  };

  return (
    <div className="max-w-2xl mx-auto font-sans text-slate-900 dark:text-slate-200 flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${serializableProject.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition duration-200 outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Details
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Edit Project</h2>
        <p className="text-sm text-slate-400">
          Modify project configuration, name, description, or toggle status.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <EditProjectForm project={serializableProject} />
      </div>
    </div>
  );
}
