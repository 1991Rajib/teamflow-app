'use client';

import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement<any>;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  // Clone child to inject accessibility parameters and focus handlers
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      setVisible(true);
      (children.props as any).onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setVisible(false);
      (children.props as any).onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      setVisible(true);
      (children.props as any).onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      setVisible(false);
      (children.props as any).onBlur?.(e);
    },
    'aria-label': (children.props as any)['aria-label'] || content,
  } as any);

  return (
    <div className="relative inline-block">
      {trigger}
      {visible && (
        <div 
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[999] pointer-events-none whitespace-nowrap bg-slate-900 dark:bg-slate-800 text-slate-100 border border-slate-800 dark:border-slate-700 text-[10px] font-medium px-2 py-1 rounded shadow-xl animate-in fade-in duration-100"
        >
          {content}
        </div>
      )}
    </div>
  );
}
