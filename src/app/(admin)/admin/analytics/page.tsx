import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import AnalyticsAdminPage from '@/components/AnalyticsAdminPage';

export const metadata = {
  title: 'Analytics & Audit Logging — TeamFlow',
  description: 'View platform trends, metrics distributions, and immutable logs.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <AnalyticsAdminPage />
    </AdminLayoutWrapper>
  );
}
