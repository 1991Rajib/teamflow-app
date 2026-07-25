import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import RevenueAdminPage from '@/components/RevenueAdminPage';

export const metadata = {
  title: 'Revenue Metrics Administration — TeamFlow',
  description: 'Monitor SaaS subscription monthly recurring run-rates and payments.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <RevenueAdminPage />
    </AdminLayoutWrapper>
  );
}
