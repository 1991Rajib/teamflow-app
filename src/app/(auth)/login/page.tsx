'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function LoginPage() {
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
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get('callbackUrl');
          router.replace(callbackUrl || '/dashboard');
          router.refresh();
        }
      } catch {
        setServerError('Something went wrong. Please try again.');
        setSubmitting(false);
      }
    },
  });

  const [hasPrefilled, setHasPrefilled] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam && !hasPrefilled) {
        formik.setFieldValue('email', emailParam);
        setHasPrefilled(true);
      }
    }
  }, [hasPrefilled, formik]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-radial from-[#1e293b] to-[#0f172a] p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to manage your projects and tasks in TeamFlow
          </p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg text-center" role="alert">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                className={`w-full bg-slate-900/50 border ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                } rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <span className="text-red-400 text-xs mt-0.5">{formik.errors.email}</span>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                className={`w-full bg-slate-900/50 border ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                } rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-red-400 text-xs mt-0.5">{formik.errors.password}</span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {formik.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Redirect Footer */}
        <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-4 mt-2">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </main>
  );
}
