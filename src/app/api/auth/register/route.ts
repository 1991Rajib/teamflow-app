import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import * as Yup from 'yup';

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .trim()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Server-side validation using Yup
    try {
      await registerSchema.validate(body, { abortEarly: false });
    } catch (validationError: unknown) {
      if (validationError instanceof Yup.ValidationError) {
        const errors = validationError.inner.reduce<Record<string, string>>((acc, curr) => {
          if (curr.path) {
            acc[curr.path] = curr.message;
          }
          return acc;
        }, {});
        return NextResponse.json({ status: 'validation_error', errors }, { status: 400 });
      }
      throw validationError;
    }

    const { name, email, password } = body;
    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'EMAIL_EXISTS',
          message: 'Email address is already in use.',
        },
        { status: 400 }
      );
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create user record
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      platformRole: 'USER',
      isActive: true,
    });

    const { logPlatformActivity } = require('@/lib/audit');
    await logPlatformActivity({
      activityType: 'USER_REGISTERED',
      description: `New user account registered: ${newUser.name} (${newUser.email}).`,
      targetUserId: newUser._id.toString(),
    });

    return NextResponse.json(
      {
        status: 'success',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          platformRole: newUser.platformRole,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
