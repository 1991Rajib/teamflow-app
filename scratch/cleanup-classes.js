const fs = require('fs');

const replacementsMap = {
  'src/app/(app)/billing/page.tsx': [
    [
      'text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-slate-100',
      'text-lg font-bold text-slate-900 dark:text-slate-100'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-8',
      'bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-8'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden',
      'bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden'
    ],
    [
      'px-5 py-3 font-semibold text-slate-900 dark:text-slate-900 dark:text-slate-100',
      'px-5 py-3 font-semibold text-slate-900 dark:text-slate-100'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5',
      'bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5'
    ],
    [
      'text-slate-900 dark:text-slate-900 dark:text-slate-100',
      'text-slate-900 dark:text-slate-100'
    ]
  ],
  'src/app/(app)/dashboard/page.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5',
      'bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm dark:shadow-lg flex flex-col gap-6',
      'bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm dark:shadow-lg flex flex-col gap-6'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm dark:shadow-lg flex flex-col gap-4',
      'bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm dark:shadow-lg flex flex-col gap-4'
    ]
  ],
  'src/app/(app)/projects/ProjectSearchFilter.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-md font-sans',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-md font-sans'
    ]
  ],
  'src/app/(app)/projects/[projectId]/page.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col gap-6',
      'bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col gap-6'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-800/50 rounded-xl gap-3',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-800/50 rounded-xl gap-3'
    ]
  ],
  'src/app/(app)/projects/page.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full'
    ],
    [
      'className="group bg-white dark:bg-[#1e293b]/20 hover:bg-white dark:bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-700/60 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-lg transition duration-200 relative overflow-hidden"',
      'className="group bg-white dark:bg-[#1e293b]/20 hover:bg-slate-50 dark:hover:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/60 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-lg transition duration-200 relative overflow-hidden"'
    ]
  ],
  'src/app/(app)/settings/WorkspaceSettingsForm.tsx': [
    [
      'text-slate-900 dark:text-slate-900 dark:text-slate-100',
      'text-slate-900 dark:text-slate-100'
    ]
  ],
  'src/app/(app)/tasks/TaskSearchFilter.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-md font-sans',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-md font-sans'
    ]
  ],
  'src/app/(app)/tasks/page.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-2xl animate-fade-in w-full'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-xl animate-fade-in w-full'
    ],
    [
      'className="group bg-white dark:bg-[#1e293b]/20 hover:bg-white dark:bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-700/60 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-lg transition duration-200 relative overflow-hidden"',
      'className="group bg-white dark:bg-[#1e293b]/20 hover:bg-slate-50 dark:hover:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/60 rounded-xl p-5 flex flex-col justify-between min-h-[180px] shadow-lg transition duration-200 relative overflow-hidden"'
    ]
  ],
  'src/app/(app)/team/PendingInvitationsList.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center shadow-sm dark:shadow-lg',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center shadow-sm dark:shadow-lg'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col gap-3',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col gap-3'
    ],
    [
      'bg-white dark:bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer',
      'bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer'
    ]
  ],
  'src/app/(app)/team/TeamList.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-2.5 shadow-sm dark:shadow-md',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-2.5 shadow-sm dark:shadow-md'
    ]
  ],
  'src/app/(app)/team/TeamSearchFilter.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-sm dark:shadow-md font-sans',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-sm dark:shadow-md font-sans'
    ]
  ],
  'src/app/(app)/team/page.tsx': [
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-2xl w-full',
      'bg-white dark:bg-[#1e293b]/15 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-2xl w-full'
    ],
    [
      'bg-white dark:bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-xl w-full',
      'bg-white dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800/60 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-xl w-full'
    ]
  ],
  'src/components/AdminLayoutWrapper.tsx': [
    [
      'bg-slate-50 dark:bg-white dark:bg-slate-950/40 space-y-4',
      'bg-slate-50 dark:bg-slate-950/40 space-y-4'
    ]
  ],
  'src/components/NotificationBell.tsx': [
    [
      'hover:text-slate-900 hover:text-slate-950 dark:hover:text-white',
      'hover:text-slate-950 dark:hover:text-white'
    ]
  ]
};

for (const [file, list] of Object.entries(replacementsMap)) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    list.forEach(([from, to]) => {
      content = content.split(from).join(to);
    });
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed:', file);
    } else {
      console.log('Already fixed or not matching:', file);
    }
  } catch (e) {
    console.error('Error fixing file:', file, e.message);
  }
}
console.log('Done cleaning up duplicate theme classes.');
