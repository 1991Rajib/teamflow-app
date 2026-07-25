import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import WorkspaceDetailsAdminPage from '@/components/WorkspaceDetailsAdminPage';
import { use } from 'react';

export const metadata = {
  title: 'Workspace Details Inspection — TeamFlow',
  description: 'View workspace statistics and administrative controls.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <AdminLayoutWrapper>
      <WorkspaceDetailsAdminPage id={id} />
    </AdminLayoutWrapper>
  );
}
