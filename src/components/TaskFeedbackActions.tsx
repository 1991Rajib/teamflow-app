'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import Tooltip from './Tooltip';
import TaskCommentsDialog from './TaskCommentsDialog';

interface TaskFeedbackActionsProps {
  taskId: string;
  taskTitle: string;
  projectName: string;
  assignedMemberName: string | null;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  large?: boolean;
}

export default function TaskFeedbackActions({
  taskId,
  taskTitle,
  projectName,
  assignedMemberName,
  currentUserRole,
  large = false,
}: TaskFeedbackActionsProps) {
  const [open, setOpen] = useState(false);

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Comments & Feedback Button */}
        <Tooltip content="Comments & Feedback">
          <button
            onClick={handleActionClick}
            aria-label="Comments & Feedback"
            className={
              large
                ? 'p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer'
                : 'p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition duration-150 relative z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 flex items-center justify-center'
            }
          >
            <MessageSquare className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          </button>
        </Tooltip>
      </div>

      {open && (
        <TaskCommentsDialog
          isOpen={open}
          onClose={() => setOpen(false)}
          taskId={taskId}
          taskTitle={taskTitle}
          projectName={projectName}
          assignedMemberName={assignedMemberName}
          currentUserRole={currentUserRole}
        />
      )}
    </>
  );
}
