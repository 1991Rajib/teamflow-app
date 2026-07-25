import { auth } from '@/auth';
import Link from 'next/link';
import { PLAN_META } from '@/config/plans';
import { 
  CheckCircle2, 
  ArrowRight, 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Zap, 
  ChevronDown
} from 'lucide-react';

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#070a13]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-900/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
              TeamFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link href="#about" className="hover:text-blue-500 dark:hover:text-blue-400 transition">About</Link>
            <Link href="#features" className="hover:text-blue-500 dark:hover:text-blue-400 transition">Features</Link>
            <Link href="#pricing" className="hover:text-blue-500 dark:hover:text-blue-400 transition">Pricing</Link>
            <Link href="#faq" className="hover:text-blue-500 dark:hover:text-blue-400 transition">FAQ</Link>
          </div>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="hidden md:block text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Log in
                </Link>
                <Link 
                  href="/register"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-md shadow-blue-600/20"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Team Productivity Redefined
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Manage your team's work <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              without the chaos.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10">
            TeamFlow brings all your projects, tasks, and people into one centralized workspace. 
            Streamline collaboration, hit deadlines faster, and scale your operations effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={session?.user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {session?.user ? 'Open Dashboard' : 'Start for free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="#about"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white dark:bg-[#0a0e1a] border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Everything you need to run your business</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Stop juggling multiple apps. TeamFlow provides a unified platform where strategy meets execution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Unified Workspaces</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Create isolated environments for different clients or departments. Keep data separated securely while maintaining a global overview.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Zap className="w-32 h-32 text-blue-500" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 relative z-10">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">Project & Task Management</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">
                Break down complex goals into manageable tasks. Assign owners, set deadlines, and track progress visually.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Team Collaboration</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Invite members with granular role-based access control. From Admins to Viewers, everyone gets exactly the access they need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Start for free, upgrade when you need more power. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{PLAN_META.FREE.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-slate-900 dark:text-white">${PLAN_META.FREE.price}</span>
                <span className="text-sm font-semibold text-slate-500">/ forever</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
                Perfect for individuals and small teams just getting started.
              </p>
              
              <div className="flex-1 space-y-4 mb-8">
                {PLAN_META.FREE.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={session?.user ? "/dashboard" : "/register"}
                className="w-full py-3 px-4 text-center text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 dark:bg-[#0f1525] border-2 border-blue-500 rounded-3xl p-8 flex flex-col relative shadow-xl shadow-blue-500/10 transform md:-translate-y-4">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{PLAN_META.PRO.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">${PLAN_META.PRO.price}</span>
                <span className="text-sm font-semibold text-slate-400">/ {PLAN_META.PRO.billingInterval.toLowerCase()}</span>
              </div>
              <p className="text-slate-400 text-sm mb-8">
                For growing teams that need unlimited potential and advanced features.
              </p>
              
              <div className="flex-1 space-y-4 mb-8">
                {PLAN_META.PRO.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={session?.user ? "/dashboard" : "/register"}
                className="w-full py-3 px-4 text-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-100/50 dark:bg-[#070a13] border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Everything you need to know about TeamFlow and billing.
            </p>
          </div>

          <div className="space-y-4">
            {/* Native HTML details/summary for zero-JS accordion */}
            <details className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white list-none">
                Can I upgrade or downgrade at any time?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed">
                Yes, you can upgrade your plan at any point. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of your current billing cycle.
              </p>
            </details>

            <details className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white list-none">
                What happens when I hit the limits on the Free plan?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed">
                Once you reach the limit for members, projects, or tasks on the Free plan, you will need to upgrade to the Pro plan to add more. You will not lose any existing data.
              </p>
            </details>

            <details className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white list-none">
                Do I need a credit card to sign up?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed">
                No! You can sign up for the Free plan without a credit card. We only require payment details when you decide to upgrade to the Pro plan.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                TeamFlow
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              The modern operating system for your team's most important work. 
              Designed for speed, clarity, and collaboration.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#features" className="hover:text-blue-400 transition">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-blue-400 transition">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-blue-400 transition">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#about" className="hover:text-blue-400 transition">About Us</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800/50 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TeamFlow Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>Designed with ♥️ for productive teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
