import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import UserDetailsAdminPage from '@/components/UserDetailsAdminPage';

export const metadata = {
  title: 'User Profile Inspection — TeamFlow',
  description: 'View platform membership permissions and account settings.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <AdminLayoutWrapper>
      <UserDetailsAdminPage id={id} />
    </AdminLayoutWrapper>
  );
}
