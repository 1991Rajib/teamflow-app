'use client';

import { useEffect } from 'react';

export default function SyncActiveTenantCookie({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    // Write cookie client-side to prevent Next.js Server Component rendering errors
    document.cookie = `activeTenantId=${tenantId}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  }, [tenantId]);

  return null;
}
