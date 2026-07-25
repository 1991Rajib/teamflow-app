import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import PlatformConfig from '@/models/PlatformConfig';
import { logPlatformActivity } from '@/lib/audit';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Fetch all keys or assign default configuration entries if empty
    const configs = await PlatformConfig.find();
    const configMap: Record<string, any> = {
      platformName: 'TeamFlow',
      supportEmail: 'support@teamflow.com',
      allowRegistrations: true,
      allowNewWorkspaces: true,
      sessionTimeout: 120,
      requireMfa: false,
    };

    for (const conf of configs) {
      configMap[conf.key] = conf.value;
    }

    return NextResponse.json({ settings: configMap });
  } catch (error: any) {
    console.error('[API_ADMIN_SETTINGS_GET_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid settings body.' }, { status: 400 });
    }

    await dbConnect();

    // Iterate and upsert each key/value configuration entry
    for (const [key, value] of Object.entries(settings)) {
      await PlatformConfig.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
    }

    await logPlatformActivity({
      activityType: 'ADMIN_PROMOTED', // Fallback categorizer for security changes
      description: 'Platform system settings updated by Platform Administrator.',
      adminUserId: session.user.id,
    });

    return NextResponse.json({ status: 'success', message: 'System configuration saved successfully.' });
  } catch (error: any) {
    console.error('[API_ADMIN_SETTINGS_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
