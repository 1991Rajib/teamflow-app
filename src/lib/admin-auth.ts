import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function checkPlatformAdmin() {
  const session = await auth();
  if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
    return null;
  }
  return session.user;
}

export async function requirePlatformAdmin() {
  const user = await checkPlatformAdmin();
  if (!user) {
    redirect('/dashboard');
  }
  return user;
}
