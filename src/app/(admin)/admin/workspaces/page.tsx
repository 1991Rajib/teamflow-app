import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import WorkspacesAdminPage from '@/components/WorkspacesAdminPage';

export const metadata = {
  title: 'Workspaces Administration — TeamFlow',
  description: 'Manage platform tenant organizations.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <WorkspacesAdminPage />
    </AdminLayoutWrapper>
  );
}
