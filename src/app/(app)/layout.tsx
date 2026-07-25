import { redirect } from 'next/navigation';
import { getActiveTenantContext } from '@/lib/tenant-context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SyncActiveTenantCookie from '@/components/SyncActiveTenantCookie';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Resolve server-side active tenant context
  const context = await getActiveTenantContext();

  // If user has no active workspaces, redirect to onboarding page
  if (!context) {
    redirect('/onboarding');
  }

  const { user, tenant } = context;

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans overflow-hidden">
      {/* Client-side cookie synchronizer */}
      <SyncActiveTenantCookie tenantId={tenant.id} />

      {/* Persistent Sidebar for Desktop */}
      <Sidebar
        currentTenantId={tenant.id}
        currentTenantName={tenant.name}
        currentTenantLogo={tenant.logo}
        platformRole={user.platformRole}
        userName={user.name}
        userEmail={user.email}
        className="hidden lg:flex flex-shrink-0 h-screen transition-all duration-300"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentTenantId={tenant.id}
          currentTenantName={tenant.name}
          currentTenantLogo={tenant.logo}
          platformRole={user.platformRole}
          userName={user.name}
          userEmail={user.email}
        />
        {tenant.status === 'ARCHIVED' && (
          <div
            role="alert"
            className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 px-6 py-3 text-xs sm:text-sm flex items-center gap-2 flex-shrink-0 animate-fade-in font-medium select-none"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">!</span>
            <span>This workspace is archived. Only read-only operations are permitted. No new projects, tasks, or members can be created.</span>
          </div>
        )}
        {tenant.status === 'SUSPENDED' && (
          <div
            className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 px-6 py-3 text-xs sm:text-sm flex items-center gap-2 flex-shrink-0 animate-fade-in font-medium select-none"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold flex-shrink-0">!</span>
            <span>This workspace has been suspended by the platform administrator. Access is read-only and all actions are blocked.</span>
          </div>
        )}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50 dark:bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
