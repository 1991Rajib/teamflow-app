'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DueDatePicker from '@/components/DueDatePicker';

interface NewTaskFormProps {
  projects: { id: string; name: string }[];
  teamMembers: { id: string; name: string; email: string }[];
  initialProjectId: string;
}

const taskValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(150, 'Task title must be under 150 characters')
    .required('Task title is required'),
  description: Yup.string()
    .trim()
    .max(1000, 'Description must be under 1000 characters')
    .optional()
    .nullable(),
  projectId: Yup.string().required('Project is required'),
  status: Yup.string()
    .oneOf(['TODO', 'IN_PROGRESS', 'DONE'], 'Invalid status')
    .required('Status is required'),
  priority: Yup.string()
    .oneOf(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority')
    .required('Priority is required'),
  assignedTo: Yup.string().optional().nullable(),
  dueDate: Yup.date().optional().nullable(),
});

export default function NewTaskForm({
  projects,
  teamMembers,
  initialProjectId,
}: NewTaskFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // Pre-select project ID from context or fall back to the first available project
  const defaultProjectId =
    initialProjectId && projects.some((p) => p.id === initialProjectId)
      ? initialProjectId
      : projects[0]?.id || '';

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      projectId: defaultProjectId,
      status: 'TODO',
      priority: 'MEDIUM',
      assignedTo: '',
      dueDate: '',
    },
    validationSchema: taskValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            projectId: values.projectId,
            status: values.status,
            priority: values.priority,
            assignedTo: values.assignedTo || null,
            // Send a plain "YYYY-MM-DD" date string — no time, no timezone conversion
            dueDate: values.dueDate || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.status === 'validation_error' && data.errors) {
            formik.setErrors(data.errors);
          } else {
            setServerError(data.message || 'Failed to create task.');
          }
          setSubmitting(false);
          return;
        }

        // Redirect back to Project Details if we created the task from there, otherwise to general Tasks list
        if (initialProjectId) {
          router.push(`/projects/${initialProjectId}`);
        } else {
          router.push('/tasks');
        }
        router.refresh();
      } catch {
        setServerError('An unexpected error occurred. Please try again.');
        setSubmitting(false);
      }
    },
  });

  const handleCancelHref = initialProjectId ? `/projects/${initialProjectId}` : '/tasks';

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
      {serverError && (
        <div
          className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg text-center"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* Task Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Task Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          placeholder="e.g. Design homepage layout, Resolve MongoDB connection pool issue"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`w-full bg-white dark:bg-slate-900 border ${
            formik.touched.title && formik.errors.title
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50`}
        />
        {formik.touched.title && formik.errors.title && (
          <span className="text-red-400 text-xs mt-0.5">{formik.errors.title}</span>
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
          placeholder="Detailed task list or guidelines..."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`w-full bg-white dark:bg-slate-900 border ${
            formik.touched.description && formik.errors.description
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 resize-none`}
        />
        {formik.touched.description && formik.errors.description && (
          <span className="text-red-400 text-xs mt-0.5">{formik.errors.description}</span>
        )}
      </div>

      {/* Project Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="projectId" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Associated Project
        </label>
        <select
          id="projectId"
          name="projectId"
          value={formik.values.projectId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 cursor-pointer"
        >
          <option value="" disabled>Select project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {formik.touched.projectId && formik.errors.projectId && (
          <span className="text-red-400 text-xs mt-0.5">{formik.errors.projectId}</span>
        )}
      </div>

      {/* Status, Priority & Assignment Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
          {formik.touched.status && formik.errors.status && (
            <span className="text-red-400 text-xs mt-0.5">{formik.errors.status}</span>
          )}
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formik.values.priority}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          {formik.touched.priority && formik.errors.priority && (
            <span className="text-red-400 text-xs mt-0.5">{formik.errors.priority}</span>
          )}
        </div>

        {/* Assignment */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignedTo" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Assign To
          </label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formik.values.assignedTo}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
          {formik.touched.assignedTo && formik.errors.assignedTo && (
            <span className="text-red-400 text-xs mt-0.5">{formik.errors.assignedTo}</span>
          )}
        </div>
      </div>

      {/* Deadline / Due Date */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Deadline / Due Date <span className="text-slate-500 font-normal text-[10px] lowercase">(optional)</span>
        </label>
        <DueDatePicker
          id="dueDate"
          name="dueDate"
          value={formik.values.dueDate}
          onChange={(val) => formik.setFieldValue('dueDate', val)}
          onBlur={() => formik.setFieldTouched('dueDate', true)}
          disabled={formik.isSubmitting}
          hasError={!!(formik.touched.dueDate && formik.errors.dueDate)}
        />
        {formik.touched.dueDate && formik.errors.dueDate && (
          <span className="text-red-400 text-xs mt-0.5">{formik.errors.dueDate as string}</span>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-800/80 pt-5">
        <Link
          href={handleCancelHref}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={formik.isSubmitting || !formik.isValid}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Task...
            </>
          ) : (
            'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}
