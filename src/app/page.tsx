import { auth } from '@/auth';
import Link from 'next/link';
import { LandingAnimations } from '@/components/LandingAnimations';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { MobileNav } from '@/components/MobileNav';
import { PLAN_META } from '@/config/plans';
import {
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Zap,
  ChevronDown,
  Play,
  XCircle,
  Search,
  Lock,
  Clock,
  MessageSquare,
  BarChart,
  Briefcase
} from 'lucide-react';

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a13] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300">
      <LandingAnimations />

      {/* 1. Navigation */}
      <nav className="w-full bg-white/80 dark:bg-[#070a13]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm tracking-tighter">TF</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              TeamFlow
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">How it Works</Link>
            <Link href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing</Link>
            <Link href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">FAQ</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4">
              <ThemeSwitcher />
            </div>
            {session?.user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition px-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
            <MobileNav hasSession={!!session?.user} />
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-40 md:pt-44 pb-16 md:pb-20 overflow-hidden bg-gradient-to-b from-white to-slate-50/50 dark:from-[#070a13] dark:to-slate-900/50">
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-2xl gsap-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500"></span>
              NEW: TEAMFLOW AI INTEGRATION
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-6">
              Bring Your Team's <br className="hidden lg:block" /> Work Together In <br className="hidden lg:block" /> One Place
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
              TeamFlow is the unified platform where strategy meets execution. Centralize projects, tasks, and communication seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href={session?.user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 text-center"
              >
                Start for free
              </Link>
            </div>
          </div>

          <div className="relative gsap-fade-up">
            {/* Dashboard Image */}
            <div className="relative rounded-2xl bg-white dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden aspect-[4/3] transform lg:translate-x-12 lg:scale-105 pointer-events-none select-none flex items-center justify-center">
              <img src="/dashboard-light.jpeg" alt="Dashboard Preview" className="w-full h-full object-cover object-left-top dark:hidden" />
              <img src="/dashboard-dark.jpeg" alt="Dashboard Preview" className="w-full h-full object-cover object-left-top hidden dark:block" />
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute -left-12 top-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Task Completed</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Logo Cloud */}
      <section className="py-8 md:py-12 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-center text-sm font-semibold text-slate-400 dark:text-slate-500 mb-8 tracking-widest uppercase">Trusted by forward-thinking teams</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 dark:opacity-30 grayscale">
            <h3 className="text-2xl font-bold font-serif">Acme Corp</h3>
            <h3 className="text-2xl font-bold">Quantum</h3>
            <h3 className="text-2xl font-bold font-mono">Globex</h3>
            <h3 className="text-2xl font-bold tracking-tighter">Soylent</h3>
            <h3 className="text-2xl font-bold italic">Initech</h3>
            <h3 className="text-2xl font-bold">Stark Ind.</h3>
          </div>
        </div>
      </section>

      {/* 4. Problem vs Solution Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Problem */}
          <div className="space-y-6 gsap-fade-up">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Stop Managing Your Work<br /> Across Too Many Tools
            </h2>
            <div className="space-y-4 pt-4 gsap-stagger">
              {[
                "Lost context switching between 5 different apps",
                "Important files scattered across personal drives",
                "Unclear responsibilities and missed deadlines",
                "No single source of truth for project status"
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-500/10 border border-red-100/50 dark:border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="space-y-6 gsap-fade-up">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              TeamFlow Brings Everything<br /> Together
            </h2>
            <div className="space-y-4 pt-4 gsap-stagger">
              {[
                "One unified workspace for all tasks and chats",
                "Files securely attached directly to relevant projects",
                "Clear assignees, due dates, and real-time updates",
                "Instant birds-eye view of all company operations"
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 gsap-fade-up">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">Everything Your Team Needs to Get Work Done</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 gsap-stagger">
            {[
              { icon: LayoutDashboard, title: "Workspaces", desc: "Create isolated environments for clients or departments. Keep data separated securely." },
              { icon: CheckCircle2, title: "Task Management", desc: "Break down complex goals into manageable tasks. Assign owners and set deadlines." },
              { icon: Clock, title: "Real-Time Updates", desc: "See changes as they happen. No refreshing required. Stay in sync instantly." },
              { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular control over who sees what. From Admins to Viewers, manage permissions easily." },
              { icon: BarChart, title: "Visual Reporting", desc: "Understand your team's velocity and workload at a glance with beautiful charts." },
              { icon: Zap, title: "Fast & Reliable", desc: "Built on modern web technologies ensuring blazing fast load times and interactions." }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Showcase Section */}
      <section className="py-16 md:py-24 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <div className="gsap-fade-up">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">See Your Work. Know What's Next.</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-16 max-w-2xl mx-auto">Get absolute clarity on company priorities and individual responsibilities.</p>
          </div>

          <div className="relative max-w-5xl mx-auto gsap-fade-up">
            {/* Center Dashboard Image */}
            <div className="rounded-2xl bg-white dark:bg-[#070a13] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] lg:aspect-[16/9] relative z-10 pointer-events-none select-none flex items-center justify-center">
              <img src="/dashboard-light.jpeg" alt="Dashboard Preview" className="w-full h-full object-cover object-left-top dark:hidden" />
              <img src="/dashboard-dark.jpeg" alt="Dashboard Preview" className="w-full h-full object-cover object-left-top hidden dark:block" />
            </div>

            {/* Floating cards around showcase */}
            <div className="hidden lg:block absolute -left-20 top-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20">
              <p className="font-bold text-sm dark:text-white">✅ Q3 Marketing Plan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Due Tomorrow</p>
            </div>
            <div className="hidden lg:block absolute -right-16 bottom-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20">
              <p className="font-bold text-sm flex items-center gap-2 dark:text-white"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sarah joined the workspace</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How it Works (Dark Section) */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-950 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-20 gsap-fade-up">
            <h2 className="text-4xl font-extrabold mb-4">Up and Running in Minutes</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">No complex onboarding. Just sign up and start executing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative gsap-stagger">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[1px] bg-slate-800 z-0"></div>

            {[
              { num: "01", title: "Create a Workspace", desc: "Set up a dedicated environment for your company, department, or client project in one click." },
              { num: "02", title: "Invite Your Team", desc: "Add members via email with granular role-based permissions (Admin, Member, Viewer)." },
              { num: "03", title: "Collaborate & Execute", desc: "Start creating tasks, assigning owners, and tracking progress in real-time." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl mb-6">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Workspace Feature Section */}
      <section className="py-16 md:py-24 bg-slate-50/50 dark:bg-[#070a13] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="gsap-fade-up">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-sm mb-4">Architecture</div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
              One Platform. <br />Separate Workspaces.
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Maintain strict data boundaries between different clients or internal departments. Switch between workspaces instantly without logging out.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition">
              Learn more about workspaces <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative gsap-fade-up">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 max-w-md mx-auto">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <span className="text-white font-bold">TF</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Your Account</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">rajib@example.com</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">Acme Corp Project</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">M</div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Marketing Dept</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">P</div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Personal Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Scale/Stats Section */}
      <section className="py-16 md:py-24 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 gsap-fade-up">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Built for Teams at Every Stage</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100 dark:divide-slate-800 text-center gsap-stagger">
            <div>
              <h3 className="text-5xl font-black text-indigo-600 dark:text-indigo-500 mb-2">99.9%</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Uptime SLA</p>
            </div>
            <div>
              <h3 className="text-5xl font-black text-indigo-600 dark:text-indigo-500 mb-2">10x</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Faster Execution</p>
            </div>
            <div>
              <h3 className="text-5xl font-black text-indigo-600 dark:text-indigo-500 mb-2">24/7</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Expert Support</p>
            </div>
            <div>
              <h3 className="text-5xl font-black text-indigo-600 dark:text-indigo-500 mb-2">∞</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Scalability</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 gsap-fade-up">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Start for free, upgrade when you need more power. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center gsap-stagger">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-sm relative z-10">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{PLAN_META.FREE.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Perfect for individuals and small teams.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-slate-900 dark:text-white">${PLAN_META.FREE.price}</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ forever</span>
              </div>

              <div className="space-y-4 mb-10">
                {PLAN_META.FREE.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={session?.user ? "/dashboard" : "/register"}
                className="block w-full py-3.5 px-4 text-center text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 rounded-3xl p-10 shadow-2xl relative z-20 md:-ml-4 transform md:scale-105 border-4 border-indigo-600">
              <div className="absolute top-0 right-10 -translate-y-1/2">
                <span className="bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{PLAN_META.PRO.name}</h3>
              <p className="text-indigo-200 text-sm mb-6">For growing teams needing advanced features.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">${PLAN_META.PRO.price}</span>
                <span className="text-sm font-semibold text-indigo-200">/ {PLAN_META.PRO.billingInterval.toLowerCase()}</span>
              </div>

              <div className="space-y-4 mb-10">
                {PLAN_META.PRO.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                    <span className="text-sm font-medium text-white">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={session?.user ? "/dashboard" : "/register"}
                className="block w-full py-3.5 px-4 text-center text-sm font-bold text-indigo-600 bg-white hover:bg-slate-50 rounded-xl transition shadow-lg"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Security Section */}
      <section className="py-16 md:py-24 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 gsap-fade-up">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Built with Security in Mind</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 gsap-stagger">
            {[
              { icon: Lock, title: "Data Encryption", desc: "AES-256 encryption at rest and in transit." },
              { icon: ShieldCheck, title: "SOC2 Compliant", desc: "Independently audited security practices." },
              { icon: Users, title: "SSO Available", desc: "Integrate with Okta, Google, and more." },
              { icon: Briefcase, title: "Data Privacy", desc: "GDPR and CCPA compliant infrastructure." }
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-indigo-600 dark:hover:border-indigo-500 transition duration-300 text-center bg-white dark:bg-slate-900/50">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-700 dark:text-slate-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ Section */}
      <section id="faq" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16 gsap-fade-up">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4 gsap-stagger">
            <details className="group border-b border-slate-200 dark:border-slate-800 py-4 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-lg text-slate-900 dark:text-white list-none outline-none">
                Can I upgrade or downgrade at any time?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed pb-4">
                Yes, you can upgrade your plan at any point. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of your current billing cycle.
              </p>
            </details>

            <details className="group border-b border-slate-200 dark:border-slate-800 py-4 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-lg text-slate-900 dark:text-white list-none outline-none">
                What happens when I hit the limits on the Free plan?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed pb-4">
                Once you reach the limit for members, projects, or tasks on the Free plan, you will need to upgrade to the Pro plan to add more. You will not lose any existing data.
              </p>
            </details>

            <details className="group border-b border-slate-200 dark:border-slate-800 py-4 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-lg text-slate-900 dark:text-white list-none outline-none">
                Do I need a credit card to sign up?
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed pb-4">
                No! You can sign up for the Free plan without a credit card. We only require payment details when you decide to upgrade to the Pro plan.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* 13. Final CTA & 14. Footer */}
      <div className="bg-slate-950 text-white">
        <section className="py-16 md:py-24 border-b border-slate-800">
          <div className="max-w-[1400px] mx-auto px-6 text-center gsap-fade-up">
            <h2 className="text-5xl font-extrabold mb-8">Bring Your Team's Work Into Focus</h2>
            <Link
              href={session?.user ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
            >
              Start your free trial
            </Link>
          </div>
        </section>

        <footer className="pt-20 pb-10">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm tracking-tighter">TF</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  TeamFlow
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                The modern operating system for your team's most important work.
                Designed for speed, clarity, and collaboration.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Quick Links</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-center pt-8 border-t border-slate-800 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} TeamFlow Inc. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
