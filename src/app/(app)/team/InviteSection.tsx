'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import InviteMemberDialog from '@/components/InviteMemberDialog';

interface InviteSectionProps {
  workspaceName: string;
}

export default function InviteSection({ workspaceName }: InviteSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">Invite a New Member</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans">
            Invite colleagues to join the <span className="font-medium text-slate-700 dark:text-slate-300">{workspaceName}</span> workspace by email and assign them standard workspace roles.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition whitespace-nowrap self-stretch md:self-auto text-center"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <InviteMemberDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
