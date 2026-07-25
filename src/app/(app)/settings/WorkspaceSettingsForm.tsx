'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Sliders,
  Users,
  CreditCard,
  AlertTriangle,
  Upload,
  X,
  Check,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface WorkspaceSettings {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
  contactEmail: string;
  timezone: string;
  dateFormat: string;
  status: 'ACTIVE' | 'ARCHIVED';
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface BillingLimits {
  maxMembers: string;
  maxProjects: string;
  maxTasksPerProject: string;
  rawMaxMembers: number;
  rawMaxProjects: number;
  rawMaxTasksPerProject: number;
}

interface BillingUsage {
  members: number;
  projects: number;
  tasks: number;
}

interface WorkspaceSettingsFormProps {
  currentTenantId: string;
}

export default function WorkspaceSettingsForm({ currentTenantId }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'members' | 'billing' | 'danger'>('profile');
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [billing, setBilling] = useState<{ planCode: string; status: string } | null>(null);
  const [limits, setLimits] = useState<BillingLimits | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [logo, setLogo] = useState('');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Danger Zone states
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Fetch workspace settings
        const settingsRes = await fetch('/api/workspace/settings');
        if (!settingsRes.ok) {
          throw new Error('Failed to load workspace settings.');
        }
        const settingsData = await settingsRes.json();
        const ws = settingsData.workspace as WorkspaceSettings;
        setSettings(ws);

        // Prepopulate form fields
        setName(ws.name);
        setDescription(ws.description);
        setCompanyName(ws.companyName);
        setWebsite(ws.website);
        setIndustry(ws.industry);
        setCompanySize(ws.companySize);
        setContactEmail(ws.contactEmail);
        setTimezone(ws.timezone);
        setDateFormat(ws.dateFormat);
        setLogo(ws.logo);

        // Fetch workspace billing limits & usage
        const billingRes = await fetch('/api/billing');
        if (billingRes.ok) {
          const billingData = await billingRes.json();
          setBilling(billingData.billing);
          setLimits(billingData.limits);
          setUsage(billingData.usage);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred while loading workspace settings.');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceData();
  }, [currentTenantId]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert('Workspace logo image size must be under 200KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (settings.role === 'MEMBER') return;

    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    setValidationErrors({});

    try {
      const response = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          companyName,
          website,
          industry,
          companySize,
          contactEmail,
          timezone,
          dateFormat,
          logo,
        }),
      });

      const data = await response.json();

      if (response.status === 400 && data.status === 'validation_error') {
        setValidationErrors(data.errors || {});
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings.');
      }

      setSaveSuccess(true);
      setSettings(data.workspace);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update workspace settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!settings || settings.role !== 'OWNER') return;
    if (!confirm('Are you sure you want to archive this workspace? Only read-only operations will be allowed until restored.')) return;

    setIsArchiving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/workspace/archive', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to archive workspace.');

      setSettings((prev) => prev ? { ...prev, status: 'ARCHIVED' } : null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive workspace.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (!settings || settings.role !== 'OWNER') return;

    setIsRestoring(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/workspace/restore', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to restore workspace.');

      setSettings((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore workspace.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || settings.role !== 'OWNER') return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/workspace/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceNameConfirm: deleteConfirmName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete workspace.');

      setShowDeleteModal(false);
      window.location.href = '/onboarding';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete workspace.');
    } finally {
      setIsDeleting(false);
    }
  };

  // High-Fidelity Skeleton Loader for Accessibility / System Status visibility (Heuristic #1)
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse select-none font-sans w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div>
          </div>
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="flex flex-row lg:flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 lg:w-full"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-lg w-28 lg:w-full"></div>
          </div>
          <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
              <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
              <div className="space-y-1.5 md:col-span-2"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
              <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
              <div className="space-y-1.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-md"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Unable to load workspace</h3>
        <p className="text-sm text-slate-400 mt-1">Make sure you have an active workspace membership.</p>
      </div>
    );
  }

  const isReadOnly = settings.role === 'MEMBER';
  const isOwner = settings.role === 'OWNER';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Workspace Settings Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
            Workspace Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your workspace profile, preferences, billing status, and members.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Role: {settings.role}
          </span>
          {settings.status === 'ARCHIVED' ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              Archived
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Main Settings Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="flex flex-row lg:flex-col overflow-x-auto gap-1 p-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl lg:p-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Billing & Plans
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'danger'
                ? 'bg-red-600/15 text-red-600 dark:text-red-400 font-semibold border border-red-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 space-y-6">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{errorMsg}</p>
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-fade-in">
              <Check className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm flex-1">Settings updated successfully.</p>
            </div>
          )}

          {/* TAB 1: Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Workspace Profile</h3>
                <p className="text-xs text-slate-400">Update your workspace identity and company details.</p>
              </div>

              {isReadOnly && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800/30 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  You have read-only access to this workspace. Only Owners and Admins can save changes.
                </div>
              )}

              {/* Logo Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Workspace Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 select-none shadow-inner">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer select-none"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Logo
                      </button>
                      {logo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer select-none"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="ws-name" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace Name</label>
                  <input
                    id="ws-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isReadOnly || saving}
                    placeholder="e.g. Acme Corp Workspace"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{validationErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-company" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company / Business Name</label>
                  <input
                    id="ws-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isReadOnly || saving}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="ws-desc" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace Description</label>
                  <textarea
                    id="ws-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isReadOnly || saving}
                    rows={3}
                    placeholder="Briefly describe the purpose of this workspace..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-website" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website URL</label>
                  <input
                    id="ws-website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="https://example.com"
                  />
                  {validationErrors.website && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{validationErrors.website}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-industry" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry</label>
                  <input
                    id="ws-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="e.g. Technology, Finance, Health"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-size" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Size</label>
                  <select
                    id="ws-size"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Select size...</option>
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="501+">501+ Employees</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-email" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Email</label>
                  <input
                    id="ws-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="contact@company.com"
                  />
                  {validationErrors.contactEmail && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{validationErrors.contactEmail}</p>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition select-none disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-900/35"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving Settings...' : 'Save Profile Settings'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Preferences</h3>
                <p className="text-xs text-slate-400">Configure default timezone settings and date display formats for this Workspace.</p>
              </div>

              {isReadOnly && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800/30 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  You have read-only access to this workspace. Only Owners and Admins can save changes.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="ws-timezone" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace Timezone</label>
                  <select
                    id="ws-timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                    <option value="America/New_York">America/New_York (GMT-5:00)</option>
                    <option value="Europe/London">Europe/London (GMT+0:00 / BST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8:00)</option>
                    <option value="Australia/Sydney">Australia/Sydney (GMT+10:00)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ws-dateformat" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Display Format</label>
                  <select
                    id="ws-dateformat"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    disabled={isReadOnly || saving}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none text-sm transition text-slate-900 dark:text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2026)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-31)</option>
                  </select>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition select-none disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-900/35"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving Preferences...' : 'Save Preferences'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 3: Members Link */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Workspace Members</h3>
                <p className="text-xs text-slate-400">View team structure, adjust roles, invite new teammates, or remove users.</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center justify-center md:justify-start gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Reusing Member Management
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    To maintain clean architecture, all invitation and team role management utilities are housed centrally in the **Team Management** area.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/team')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition select-none cursor-pointer"
                >
                  Go to Team Page
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Billing Limits */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Billing & Workspace Plan</h3>
                <p className="text-xs text-slate-400">Review subscription levels, billing status, and usage thresholds for this workspace.</p>
              </div>

              {billing && limits && usage && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="p-5 bg-white dark:bg-[#1e293b]/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/25 rounded-md text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                        Current Plan
                      </span>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-slate-200 mt-1.5">{billing.planCode} PLAN</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Status: <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">{billing.status}</span></p>
                    </div>

                    <button
                      onClick={() => router.push('/billing')}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition border border-slate-200 dark:border-slate-700 select-none cursor-pointer"
                    >
                      Manage Plan Billing
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Usage Progress Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Members Metric */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Workspace Members</span>
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{usage.members} / {limits.maxMembers}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${limits.rawMaxMembers > 0 ? Math.min((usage.members / limits.rawMaxMembers) * 100, 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Projects Metric */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Active Projects</span>
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{usage.projects} / {limits.maxProjects}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${limits.rawMaxProjects > 0 ? Math.min((usage.projects / limits.rawMaxProjects) * 100, 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Tasks Metric */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Workspace Tasks</span>
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{usage.tasks}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Limited to {limits.maxTasksPerProject} tasks per project.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Danger Zone */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-400">Perform destructive or administrative actions for this Workspace.</p>
              </div>

              {!isOwner && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  You cannot perform destructive workspace actions. Only the Workspace Owner has access to the Danger Zone.
                </div>
              )}

              <div className="border border-red-500/25 bg-red-500/5 rounded-2xl overflow-hidden divide-y divide-red-500/10">
                {/* Archive / Restore Action */}
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {settings.status === 'ARCHIVED' ? 'Restore Workspace' : 'Archive Workspace'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md">
                      {settings.status === 'ARCHIVED'
                        ? 'Restore this archived workspace to resume normal task activity and invite members.'
                        : 'Archive this workspace. This halts all new project, task, and team invite creations, keeping existing data read-only.'}
                    </p>
                  </div>
                  {settings.status === 'ARCHIVED' ? (
                    <button
                      onClick={handleRestore}
                      disabled={isRestoring || !isOwner}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition select-none cursor-pointer"
                    >
                      {isRestoring ? 'Restoring...' : 'Restore Workspace'}
                    </button>
                  ) : (
                    <button
                      onClick={handleArchive}
                      disabled={isArchiving || !isOwner}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition select-none cursor-pointer"
                    >
                      {isArchiving ? 'Archiving...' : 'Archive Workspace'}
                    </button>
                  )}
                </div>

                {/* Permanent Delete Action */}
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Workspace</h4>
                    <p className="text-xs text-slate-400 max-w-md">
                      Permanently delete this workspace and all associated projects, tasks, comments, memberships, and billing subscriptions. **This action cannot be undone.**
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={!isOwner}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition select-none cursor-pointer"
                  >
                    Delete Workspace
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Workspace Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmName('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Confirm Workspace Deletion
              </h3>
              <p className="text-xs text-slate-400">
                You are about to delete <strong className="text-slate-900 dark:text-slate-200">{settings.name}</strong>. All workspace projects, tasks, member credentials, and billing profiles will be permanently erased.
              </p>
            </div>

            <form onSubmit={handleDeleteWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">
                  To confirm, type <strong className="text-slate-700 dark:text-slate-200 select-all">{settings.name}</strong> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-red-500 outline-none text-sm transition text-slate-900 dark:text-slate-200"
                  placeholder={settings.name}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmName('');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeleting ||
                    deleteConfirmName.trim().toLowerCase() !== settings.name.trim().toLowerCase()
                  }
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-xs transition"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
