import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import AdminSettingsPage from '@/components/AdminSettingsPage';

export const metadata = {
  title: 'System Settings — TeamFlow Console',
  description: 'Manage central system configuration parameters and feature flags.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <AdminSettingsPage />
    </AdminLayoutWrapper>
  );
}
