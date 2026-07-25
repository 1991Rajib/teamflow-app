import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6">
      <div className="flex flex-col items-center justify-center text-center p-8 bg-[#1e293b]/25 border border-slate-800/80 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
