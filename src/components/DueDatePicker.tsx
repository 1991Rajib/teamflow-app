'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

// Import react-day-picker base CSS (we override all visuals below)
import 'react-day-picker/style.css';

interface DueDatePickerProps {
  id?: string;
  name?: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * DueDatePicker
 *
 * A fully styled calendar popup using react-day-picker, matching TeamFlow's dark UI.
 *
 * Contract:
 *  - value / onChange use plain "YYYY-MM-DD" strings (no timezone)
 *  - Past dates are disabled
 *  - Today is highlighted with a distinct ring
 *  - Selected date shown in the trigger input field
 *  - Popup closes on outside click or Escape key
 */
export default function DueDatePicker({
  id = 'dueDate',
  value,
  onChange,
  onBlur,
  disabled = false,
  hasError = false,
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert "YYYY-MM-DD" string → JS Date for react-day-picker (local midnight)
  const selectedDate: Date | undefined = value
    ? new Date(`${value}T00:00:00`)
    : undefined;

  // Past dates: disable any day before today (local)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleSelect(date: Date | undefined) {
    if (date) {
      // Format as "YYYY-MM-DD" using dayjs (local date, no UTC offset)
      onChange(dayjs(date).format('YYYY-MM-DD'));
    } else {
      onChange('');
    }
    setOpen(false);
    onBlur?.();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    onBlur?.();
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, onBlur]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onBlur]);

  const displayValue = value ? dayjs(value).format('MM/DD/YYYY') : '';

  return (
    <div ref={containerRef} className="relative flex gap-2">
      {/* Trigger button — styled as a form input */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `Due date: ${displayValue}` : 'Select due date'}
        className={`w-full flex items-center gap-2.5 bg-white dark:bg-slate-900 border ${
          hasError
            ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : open
            ? 'border-indigo-500 ring-4 ring-indigo-500/20'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } rounded-lg px-4 py-2.5 text-sm transition duration-200 disabled:opacity-50 cursor-pointer outline-none text-left`}
      >
        <Calendar
          className={`w-4 h-4 flex-shrink-0 ${
            hasError ? 'text-red-400' : value ? 'text-blue-400' : 'text-slate-500'
          }`}
        />
        <span className={value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
          {displayValue || 'Select due date…'}
        </span>
      </button>

      {/* Clear button */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear due date"
          aria-label="Clear due date"
          className="px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Calendar popup */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker calendar"
          className="absolute top-full left-0 z-50 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-3 min-w-[300px]"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={{ before: today }}
            defaultMonth={selectedDate ?? today}
            showOutsideDays={false}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                ),
            }}
            classNames={{
              root: 'rdp-teamflow',
              months: 'flex flex-col gap-4',
              month: 'flex flex-col gap-3',
              month_caption: 'flex items-center justify-between px-1',
              caption_label: 'text-sm font-bold text-slate-900 dark:text-slate-200',
              nav: 'flex items-center gap-1',
              button_previous:
                'p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer',
              button_next:
                'p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday:
                'flex-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 pb-2',
              week: 'flex mt-1',
              day: 'flex-1 flex items-center justify-center p-0',
              day_button:
                'w-8 h-8 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer',
              selected:
                'bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-500',
              today: 'text-blue-400 font-bold ring-1 ring-blue-500/40 rounded-lg',
              disabled: 'opacity-25 line-through cursor-not-allowed hover:!bg-transparent hover:!text-slate-500 pointer-events-none',
              outside: 'text-slate-700',
            }}
          />

          {/* Footer hint */}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-600">
              Past dates are disabled • Press <kbd className="text-slate-500 font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
