'use client';

import { useTheme, Theme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';
import Tooltip from './Tooltip';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      value: 'light' as Theme,
      label: 'Switch to light mode',
      icon: Sun,
    },
    {
      value: 'dark' as Theme,
      label: 'Switch to dark mode',
      icon: Moon,
    },
    {
      value: 'system' as Theme,
      label: 'Use system theme',
      icon: Laptop,
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 w-fit">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <Tooltip key={opt.value} content={opt.label}>
            <button
              onClick={() => setTheme(opt.value)}
              aria-label={opt.label}
              aria-pressed={isActive}
              className={`p-1.5 rounded-md transition duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
