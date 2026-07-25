'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Mail, Shield, User, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inviteSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email address is required'),
  role: Yup.string()
    .oneOf(['ADMIN', 'MEMBER'], 'Invalid role selected')
    .required('Workspace role is required'),
});

export default function InviteMemberDialog({
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      role: 'MEMBER',
    },
    validationSchema: inviteSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setServerError(null);
      setEmailWarning(null);
      try {
        const response = await fetch('/api/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            role: values.role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.message || 'Failed to send invitation.');
          setSubmitting(false);
          return;
        }

        // Invitation created — check if email delivery failed
        if (data.emailDeliveryFailed) {
          setEmailWarning(data.message || 'Invitation created, but email could not be delivered.');
          resetForm();
          setSubmitting(false);
          onSuccess(); // still refresh parent list
          return;
        }

        // On full success: reset form, trigger parent onSuccess and close the modal
        resetForm();
        onSuccess();
        onClose();
      } catch (err) {
        console.error(err);
        setServerError('An unexpected error occurred. Please try again.');
        setSubmitting(false);
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 z-10 antialiased text-slate-900 dark:text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Invite New Member</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Email delivery warning — invitation saved but email failed */}
          {emailWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{emailWarning}</p>
              </div>
              <p className="text-xs text-amber-800/70 dark:text-amber-500/70 pl-6">The invitation is active — you can find the token in the Invitations list and share the link manually.</p>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Got it, close
              </button>
            </div>
          )}

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl">
              {serverError}
            </div>
          )}

          {/* Email Address Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm transition"
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <span className="text-xs text-red-600 dark:text-red-400 mt-0.5">{formik.errors.email}</span>
            )}
          </div>

          {/* Workspace Role Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Workspace Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Member Card Option */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition select-none ${formik.values.role === 'MEMBER'
                    ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-slate-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="MEMBER"
                  checked={formik.values.role === 'MEMBER'}
                  onChange={() => formik.setFieldValue('role', 'MEMBER')}
                  className="sr-only"
                />
                <User className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Member</span>
                  <span className="text-[10px] text-slate-500">Can view & comment</span>
                </div>
              </label>

              {/* Admin Card Option */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition select-none ${formik.values.role === 'ADMIN'
                    ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-slate-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={formik.values.role === 'ADMIN'}
                  onChange={() => formik.setFieldValue('role', 'ADMIN')}
                  className="sr-only"
                />
                <Shield className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Admin</span>
                  <span className="text-[10px] text-slate-500">Can invite & manage</span>
                </div>
              </label>
            </div>
          </div>

          <div className="w-full border-t border-slate-200 dark:border-slate-800 my-1" />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={formik.isSubmitting}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-sm transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl text-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
