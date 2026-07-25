'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, Sparkles, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

const onboardingSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name must be under 100 characters')
    .required('Workspace name is required'),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);



  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: onboardingSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await fetch('/api/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.message || 'Failed to create workspace.');
          setSubmitting(false);
          return;
        }

        router.replace('/dashboard');
        router.refresh();
      } catch {
        setServerError('Something went wrong. Please try again.');
        setSubmitting(false);
      }
    },
  });

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-[#1e293b] to-[#0f172a] p-4 font-sans text-slate-100 relative">
      {/* Top-right sign out to ensure user control & freedom */}
      <div className="absolute top-4 right-4 animate-fade-in">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Sign Out
        </button>
      </div>

      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <div className="mx-auto w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Create Your Workspace
          </h1>
          <p className="text-slate-400 text-sm">
            To get started with TeamFlow, create your first organization/workspace.
          </p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg text-center animate-shake" role="alert">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace / Organization Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              placeholder="e.g. Acme Corporation, Marketing Team"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={formik.isSubmitting}
              className={`w-full bg-slate-900/50 border ${
                formik.touched.name && formik.errors.name
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20'
              } rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50`}
            />
            {formik.touched.name && formik.errors.name && (
              <span className="text-red-400 text-xs mt-0.5">{formik.errors.name}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {formik.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating workspace...
              </>
            ) : (
              'Create Workspace & Continue'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
