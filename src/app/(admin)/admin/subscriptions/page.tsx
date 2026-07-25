import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import SubscriptionsAdminPage from '@/components/SubscriptionsAdminPage';

export const metadata = {
  title: 'Subscriptions Administration — TeamFlow',
  description: 'Monitor Stripe platform customer subscriptions.',
};

export default async function Page() {
  return (
    <AdminLayoutWrapper>
      <SubscriptionsAdminPage />
    </AdminLayoutWrapper>
  );
}
