import { getActiveTenantContext } from '@/lib/tenant-context';
import { redirect } from 'next/navigation';
import WorkspaceSettingsForm from './WorkspaceSettingsForm';

export default async function SettingsPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    redirect('/onboarding');
  }

  // Passing tenant.id as a React 'key' guarantees that React completely unmounts and
  // remounts the child form, wiping state and re-fetching data when switching workspaces.
  return <WorkspaceSettingsForm key={context.tenant.id} currentTenantId={context.tenant.id} />;
}
