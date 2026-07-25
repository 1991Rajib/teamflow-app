import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import PlatformConfig from '@/models/PlatformConfig';

export async function POST() {
  try {
    // 1. Get authenticated session
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to execute bootstrap setup.' },
        { status: 401 }
      );
    }

    const authEmail = session.user.email.toLowerCase().trim();

    // 2. Read environmental admin email
    const initialAdminEmail = (process.env.INITIAL_PLATFORM_ADMIN_EMAIL || '').toLowerCase().trim();
    if (!initialAdminEmail) {
      return NextResponse.json(
        { error: 'CONFIGURATION_ERROR', message: 'INITIAL_PLATFORM_ADMIN_EMAIL environment variable is not defined.' },
        { status: 500 }
      );
    }

    // 3. Connect to DB
    await dbConnect();

    // 4. Verify one-time safety check (bootstrapCompleted)
    const bootstrapRecord = await PlatformConfig.findOne({ key: 'bootstrapCompleted' });
    if (bootstrapRecord && bootstrapRecord.value === true) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Platform setup has already been completed. Repeated execution is disabled.' },
        { status: 403 }
      );
    }

    // 5. Compare authenticated verified identity
    if (authEmail !== initialAdminEmail) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: `Access Denied. Authenticated email (${authEmail}) does not match the initial administrator configuration.`,
        },
        { status: 403 }
      );
    }

    // 6. Execute promotion
    const user = await User.findOneAndUpdate(
      { email: authEmail },
      { platformRole: 'PLATFORM_ADMIN' },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Your user profile could not be resolved in the database.' },
        { status: 404 }
      );
    }

    // 7. Lock bootstrap mechanism permanently
    await PlatformConfig.findOneAndUpdate(
      { key: 'bootstrapCompleted' },
      { value: true },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      status: 'success',
      message: 'Bootstrap setup completed successfully.',
      user: {
        id: user._id.toString(),
        email: user.email,
        platformRole: user.platformRole,
      },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_SETUP_ERROR]', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
