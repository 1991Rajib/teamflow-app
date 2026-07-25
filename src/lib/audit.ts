import dbConnect from '@/lib/db/mongoose';
import PlatformActivity, { IPlatformActivity } from '@/models/PlatformActivity';

interface LogAuditParams {
  activityType: IPlatformActivity['activityType'];
  description: string;
  adminUserId?: string;
  targetTenantId?: string;
  targetUserId?: string;
}

export async function logPlatformActivity({
  activityType,
  description,
  adminUserId,
  targetTenantId,
  targetUserId,
}: LogAuditParams) {
  try {
    await dbConnect();
    await PlatformActivity.create({
      activityType,
      description,
      adminUserId,
      targetTenantId,
      targetUserId,
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}
