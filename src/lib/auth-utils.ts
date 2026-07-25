import 'server-only';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';

/**
 * Retrieves the currently authenticated user from the database.
 * Verifies that the user exists and is active, and strips out password hashes.
 * Should only be used inside Server Components, Route Handlers, or Server Actions.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  await dbConnect();

  const user = await User.findById(session.user.id).select('-passwordHash');

  if (!user || !user.isActive || user.status === 'SUSPENDED') {
    return null;
  }

  return user;
}
