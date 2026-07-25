import React from 'react';

export const metadata = {
  title: 'Platform Admin — TeamFlow',
  description: 'TeamFlow SaaS central administration control panel.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
