'use client';

import { useEffect } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error Boundary]:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 font-sans antialiased">
      <body className="min-h-full flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center text-center p-8 bg-[#1e293b]/25 border border-slate-800/80 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            An unexpected error occurred in the application. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
