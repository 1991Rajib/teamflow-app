'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'ARCHIVED';
  };
}

const projectValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be under 100 characters')
    .required('Project name is required'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .nullable(),
  status: Yup.string()
    .oneOf(['ACTIVE', 'ARCHIVED'], 'Invalid status value')
    .required('Status is required'),
});

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || `/projects/${project.id}`;
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: project.name,
      description: project.description,
      status: project.status,
    },
    validationSchema: projectValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            status: values.status,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.status === 'validation_error' && data.errors) {
            formik.setErrors(data.errors);
          } else {
            setServerError(data.message || 'Failed to update project.');
          }
          setSubmitting(false);
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } catch {
        setServerError('An unexpected error occurred. Please try again.');
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
      {serverError && (
        <div
          className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg text-center"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* Project Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Project Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder="e.g. Q3 Marketing Campaign"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`w-full bg-white dark:bg-slate-900 border ${
            formik.touched.name && formik.errors.name
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50`}
        />
        {formik.touched.name && formik.errors.name && (
          <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">{formik.errors.name}</span>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Description <span className="text-slate-500 font-normal text-[10px] lowercase">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe the scope, objectives, or references of this project..."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`w-full bg-white dark:bg-slate-900 border ${
            formik.touched.description && formik.errors.description
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 resize-none`}
        />
        {formik.touched.description && formik.errors.description && (
          <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">{formik.errors.description}</span>
        )}
      </div>

      {/* Status Selection */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Project Status
        </label>
        <select
          id="status"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 cursor-pointer"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        {formik.touched.status && formik.errors.status && (
          <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">{formik.errors.status}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-200 dark:border-slate-800 pt-5">
        <Link
          href={callbackUrl}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={formik.isSubmitting || !formik.isValid}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
