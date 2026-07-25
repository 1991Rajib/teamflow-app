'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (response?.error) {
          if (response.error === 'INACTIVE_USER') {
            setServerError('Your account is currently deactivated. Please contact support.');
          } else {
            setServerError('Invalid email or password.');
          }
          setSubmitting(false);
        } else {
          // Fetch current session to verify role
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();

          if (session?.user?.platformRole === 'PLATFORM_ADMIN') {
            // Success: reload window to trigger server-side layout refresh
            window.location.reload();
          } else {
            // Sign out the user immediately since they are a normal USER
            await signOut({ redirect: false });
            setServerError('Access denied. This login is reserved for Platform Administrators.');
            setSubmitting(false);
          }
        }
      } catch {
        setServerError('Something went wrong. Please try again.');
        setSubmitting(false);
      }
    },
  });

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-radial from-[#1e293b] to-[#0f172a] p-4 font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <div className="mx-auto p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 w-fit">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
            TeamFlow Platform Admin
          </h1>
          <p className="text-slate-400 text-xs">
            Sign in with administrator privileges to manage the platform
          </p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-lg text-center" role="alert">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`w-full bg-[#0f172a]/60 border rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-550 focus:outline-none transition duration-150 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-700 focus:border-rose-500'
                }`}
                placeholder="admin@example.com"
                disabled={formik.isSubmitting}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <span className="text-red-400 text-[10px]">{formik.errors.email}</span>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={`w-full bg-[#0f172a]/60 border rounded-xl py-2 pl-10 pr-10 text-xs text-white placeholder-slate-550 focus:outline-none transition duration-150 ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-700 focus:border-rose-500'
                }`}
                placeholder="••••••••"
                disabled={formik.isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition focus:outline-none"
                disabled={formik.isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-red-400 text-[10px]">{formik.errors.password}</span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In as Admin
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center text-xs text-slate-550 border-t border-slate-800 pt-4">
          <Link href="/login" className="hover:underline hover:text-slate-350">
            Sign In as a Normal Customer
          </Link>
        </div>
      </div>
    </main>
  );
}
