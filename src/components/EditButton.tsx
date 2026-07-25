'use client';

import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

import Tooltip from './Tooltip';

interface EditButtonProps {
  href: string;
}

export default function EditButton({ href }: EditButtonProps) {
  const router = useRouter();

  return (
    <Tooltip content="Edit">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }}
        type="button"
        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition duration-150 relative z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 flex items-center justify-center"
        aria-label="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </Tooltip>
  );
}
