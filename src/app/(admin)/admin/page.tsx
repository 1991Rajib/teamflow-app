import { auth } from '@/auth';
import PlatformAdminDashboardOverview from '@/components/PlatformAdminDashboardOverview';
import AdminLoginForm from '@/components/AdminLoginForm';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.platformRole === 'PLATFORM_ADMIN';

  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  return (
    <AdminLayoutWrapper>
      <PlatformAdminDashboardOverview adminEmail={session?.user?.email || ''} />
    </AdminLayoutWrapper>
  );
}
