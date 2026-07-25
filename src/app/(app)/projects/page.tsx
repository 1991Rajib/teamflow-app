import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Project from '@/models/Project';
import Link from 'next/link';
import { FolderKanban, Plus, Calendar, Tag, FolderClosed, Eye } from 'lucide-react';
import ProjectSearchFilter from './ProjectSearchFilter';
import EditButton from '@/components/EditButton';

interface ProjectsPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  const { tenant, role } = context;
  const { q, status } = await searchParams;

  const searchQuery = q || '';
  const statusFilter = status || 'ACTIVE';

  await dbConnect();

  // 1. Get the total project count in this workspace (unfiltered)
  const totalTenantProjects = await Project.countDocuments({ tenantId: tenant.id });

  // 2. Build tenant-scoped query with filters/search
  const query: Record<string, unknown> = { tenantId: tenant.id };

  if (searchQuery.trim()) {
    query.$or = [
      { name: { $regex: searchQuery.trim(), $options: 'i' } },
      { description: { $regex: searchQuery.trim(), $options: 'i' } },
    ];
  }

  if (statusFilter !== 'ALL') {
    query.status = statusFilter;
  }

  // 3. Retrieve projects sorted by newest first
  const projects = await Project.find(query).sort({ createdAt: -1 });

  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 dark:text-slate-200 max-w-7xl mx-auto w-full">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
            Projects
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage, organize, and view all projects within the <span className="font-medium text-slate-700 dark:text-slate-300">{tenant.name}</span> workspace.
          </p>
        </div>

        {isOwnerOrAdmin && totalTenantProjects > 0 && (
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      {totalTenantProjects > 0 && (
        <ProjectSearchFilter initialSearch={searchQuery} initialStatus={statusFilter} />
      )}

      {/* Project Display States */}
      {totalTenantProjects === 0 ? (
        /* Empty Workspace State */
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
            <FolderKanban className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">No projects yet</h3>
          {isOwnerOrAdmin ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                Your workspace has no projects yet. Create your first project to start organizing your tasks and timeline schedules.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" />
                Create Your First Project
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              No projects have been created in this workspace yet. Ask your workspace Owner or Admin to set one up.
            </p>
          )}
        </div>
      ) : projects.length === 0 ? (
        /* Empty Search Results State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-500 mb-4">
            <FolderClosed className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">No projects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            No projects matched your search criteria. Try modifying your search query or changing the status filter.
          </p>
          <Link
            href="/projects"
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none"
          >
            Clear Filters & Search
          </Link>
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project._id.toString()}
              href={`/projects/${project._id.toString()}`}
              className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm hover:shadow-md transition duration-200 relative overflow-hidden"
            >
              <div className="flex flex-col gap-2.5">
                {/* Status and dates metadata */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {project.status}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Project title and description */}
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 group-hover:dark:text-white transition duration-150 truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Action trigger footer */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 text-xs font-semibold">
                <div 
                  className="flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition duration-150" 
                  title="View details" 
                  aria-label="View details"
                >
                  <Eye className="w-4 h-4" />
                </div>
                {isOwnerOrAdmin && (
                  <EditButton href={`/projects/${project._id.toString()}/edit?callbackUrl=/projects`} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
