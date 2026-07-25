'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, UserCheck, UserX, UserPlus, Check, X } from 'lucide-react';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface TeamListProps {
  members: Member[];
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  currentUserId: string;
}

export default function TeamList({
  members,
  currentUserRole,
  currentUserId,
}: TeamListProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'role' | 'remove' | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [targetRole, setTargetRole] = useState<'ADMIN' | 'MEMBER' | null>(null);

  const openRoleModal = (member: Member, role: 'ADMIN' | 'MEMBER') => {
    setSelectedMember(member);
    setTargetRole(role);
    setActiveModal('role');
    setServerError(null);
    setSuccessMessage(null);
  };

  const openRemoveModal = (member: Member) => {
    setSelectedMember(member);
    setActiveModal('remove');
    setServerError(null);
    setSuccessMessage(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMember(null);
    setTargetRole(null);
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !targetRole) return;
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Failed to update member role.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Successfully updated ${selectedMember.user.name}'s role to ${targetRole}.`);
      closeModal();
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Failed to remove member.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Successfully removed ${selectedMember.user.name} from the workspace.`);
      closeModal();
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for role badge colors
  const getRoleBadgeClass = (role: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'ADMIN':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
      case 'MEMBER':
        return 'bg-slate-500/10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alerts */}
      {successMessage && (
        <div
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2 animate-fade-in"
          role="alert"
        >
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div
          className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2 animate-fade-in"
          role="alert"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Desktop view: Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/35">
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Name</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Email</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Role</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300">Joined Date</th>
              <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {members.map((member) => {
              const isSelf = member.user.id === currentUserId;
              
              // Define rendering of action buttons based on constraints
              const renderActions = () => {
                if (isSelf || member.role === 'OWNER') return null;

                if (currentUserRole === 'OWNER') {
                  return (
                    <div className="flex items-center justify-end gap-2">
                      {member.role === 'MEMBER' ? (
                        <button
                          onClick={() => openRoleModal(member, 'ADMIN')}
                          disabled={isSubmitting}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => openRoleModal(member, 'MEMBER')}
                          disabled={isSubmitting}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Demote
                        </button>
                      )}
                      <button
                        onClick={() => openRemoveModal(member)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 transition duration-200 outline-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  );
                }

                if (currentUserRole === 'ADMIN' && member.role === 'MEMBER') {
                  return (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openRemoveModal(member)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 transition duration-200 outline-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  );
                }

                return null;
              };

              return (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition duration-150">
                  <td className="px-6 py-4 font-medium text-slate-850 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-semibold text-indigo-600 dark:text-indigo-400 uppercase text-sm">
                      {member.user.name.charAt(0)}
                    </div>
                    <span>
                      {member.user.name}
                      {isSelf && <span className="ml-1.5 text-xs text-slate-500 font-normal italic">(you)</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{member.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(member.joinedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">{renderActions()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view: Stacked card rows */}
      <div className="md:hidden flex flex-col gap-4">
        {members.map((member) => {
          const isSelf = member.user.id === currentUserId;

          const renderMobileActions = () => {
            if (isSelf || member.role === 'OWNER') return null;

            if (currentUserRole === 'OWNER') {
              return (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
                  {member.role === 'MEMBER' ? (
                    <button
                      onClick={() => openRoleModal(member, 'ADMIN')}
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Promote
                    </button>
                  ) : (
                    <button
                      onClick={() => openRoleModal(member, 'MEMBER')}
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 outline-none flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Demote
                    </button>
                  )}
                  <button
                    onClick={() => openRemoveModal(member)}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 transition duration-200 outline-none flex items-center justify-center gap-1.5"
                  >
                    Remove
                  </button>
                </div>
              );
            }

            if (currentUserRole === 'ADMIN' && member.role === 'MEMBER') {
              return (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                  <button
                    onClick={() => openRemoveModal(member)}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 transition duration-200 outline-none flex items-center justify-center gap-1.5"
                  >
                    Remove Member
                  </button>
                </div>
              );
            }

            return null;
          };

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-2.5 shadow-sm dark:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-semibold text-indigo-600 dark:text-indigo-400 uppercase text-sm">
                    {member.user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      {member.user.name}
                      {isSelf && <span className="text-[10px] text-slate-500 font-normal italic">(you)</span>}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[160px] sm:max-w-[280px]">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getRoleBadgeClass(member.role)}`}>
                  {member.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Joined Date</span>
                <span>
                  {new Date(member.joinedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {renderMobileActions()}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal: Change Role */}
      {activeModal === 'role' && selectedMember && targetRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl dark:shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 id="role-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Change Member Role?
              </h3>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition outline-none cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to change <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.user.name}</span>&apos;s role from{' '}
              <span className="font-semibold text-amber-700 dark:text-amber-400">{selectedMember.role}</span> to{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{targetRole}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition duration-200 outline-none cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChange}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Remove Member */}
      {activeModal === 'remove' && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="remove-modal-title">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl dark:shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 id="remove-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                Remove Team Member?
              </h3>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition outline-none cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.user.name}</span> from the workspace? 
              They will immediately lose access to all projects, tasks, and settings in this tenant environment.
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition duration-200 outline-none cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-500/30 transition duration-200 cursor-pointer shadow-lg shadow-red-500/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
