import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import UsersAdminPage from '@/components/UsersAdminPage';

export const metadata = {
  title: 'Users Administration — TeamFlow',
  description: 'Manage platform user accounts and permissions.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <UsersAdminPage />
    </AdminLayoutWrapper>
  );
}
