import React from 'react';
import {
  FolderKanban,
  ListTodo,
  Users,
  Award,
  Activity,
  Eye,
  Settings,
  CreditCard,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Bell,
  User as UserIcon
} from 'lucide-react';

export function DashboardPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`w-[1024px] min-w-[1024px] h-[768px] min-h-[768px] bg-[#f8fafc] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex font-sans overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl text-left ${className}`}>
      
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0B0F19] flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800/60 gap-3">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">TF</span>
          </div>
          <span className="text-base font-bold tracking-tight">TeamFlow</span>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm font-medium mb-6 cursor-pointer border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">TF</div>
              <span>Teamflow</span>
            </div>
            <ChevronDownIcon />
          </div>

          <div className="flex flex-col gap-1">
            <div className="px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-500/20">
              <ShieldAlert className="w-4 h-4" /> Platform Admin
            </div>
            <div className="px-3 py-2.5 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium flex items-center gap-3 cursor-pointer">
              <Activity className="w-4 h-4" /> Dashboard
            </div>
            <div className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer">
              <FolderKanban className="w-4 h-4" /> Projects
            </div>
            <div className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer">
              <ListTodo className="w-4 h-4" /> Tasks
            </div>
            <div className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer">
              <Users className="w-4 h-4" /> Team
            </div>
            <div className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer">
              <CreditCard className="w-4 h-4" /> Billing
            </div>
            <div className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-sm font-medium flex items-center gap-3 transition cursor-pointer">
              <Settings className="w-4 h-4" /> Settings
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 dark:border-slate-800/60 p-4">
          <div className="flex items-center justify-between px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                JD
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">John Doe</span>
                <span className="text-[10px] text-slate-500">john.doe@example.com</span>
              </div>
            </div>
            <LogOut className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] dark:bg-[#0B0F19]">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0B0F19] flex items-center px-8 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            <div className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            Dashboard
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right block">
              <div className="text-sm font-semibold">John Doe</div>
              <div className="text-[10px] text-slate-500">john.doe@example.com</div>
            </div>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"><Sun className="w-3.5 h-3.5" /></div>
              <div className="p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm text-slate-900 dark:text-white cursor-pointer"><Moon className="w-3.5 h-3.5" /></div>
              <div className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"><Laptop className="w-3.5 h-3.5" /></div>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Scrollable Content (Hidden Scrollbar for preview) */}
        <div className="flex-1 overflow-hidden p-8 flex flex-col gap-8">
          
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, John Doe
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Here is a summary of activity in the <span className="font-semibold text-slate-700 dark:text-slate-300">Teamflow</span> workspace.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-4 gap-6">
            <Card title="PROJECTS" icon={<FolderKanban className="w-4 h-4" />} value="1" subValue="/ 2" progress={50} color="bg-blue-600" />
            <Card title="TASKS" icon={<ListTodo className="w-4 h-4" />} value="1" subValue="active (1/10 per project)" progress={10} color="bg-indigo-600" />
            <Card title="TEAM MEMBERS" icon={<Users className="w-4 h-4" />} value="1" subValue="/ 3" progress={33} color="bg-emerald-500" />
            
            {/* Active Plan Card */}
            <div className="bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ACTIVE PLAN</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-2xl font-bold tracking-tight uppercase">FREE PLAN</span>
                <span className="inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  CANCELED
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Two Columns */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Recent Tasks */}
            <div className="col-span-2 bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm flex flex-col">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-semibold">Recent Tasks</h3>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">View all</span>
              </div>
              <div className="p-5 flex-1">
                <div className="p-4 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0B0F19]">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Q3 Marketing Launch</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        TODO
                      </span>
                      <span className="flex items-center gap-1.5">• Priority: MEDIUM</span>
                      <span className="flex items-center gap-1.5">• Project: Marketing</span>
                      <span className="flex items-center gap-1.5">• Due: 7/31/2026</span>
                      <span className="flex items-center gap-1.5">• Assigned: John Doe</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#131B2C] flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-indigo-500 cursor-pointer transition">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              
              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2.5">
                  <ActionBtn icon={<FolderKanban className="w-4 h-4" />} text="Go to Projects" />
                  <ActionBtn icon={<ListTodo className="w-4 h-4" />} text="Go to Tasks" />
                  <ActionBtn icon={<Users className="w-4 h-4" />} text="View Team Members" />
                </div>
              </div>

              {/* Workspace Scope */}
              <div className="bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex-1">
                <h3 className="text-base font-semibold mb-6">Workspace Scope</h3>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ACTIVE ROLE</span>
                    <span className="text-sm font-medium">OWNER</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">WORKSPACE ID</span>
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">6a6350b7eb4c72591c84781f</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">SLUG SCOPE</span>
                    <span className="text-sm font-medium">Teamflow</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, value, subValue, progress, color }: any) {
  return (
    <div className="bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm min-h-[140px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{subValue}</span>
        </div>
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, text }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0B0F19] hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-sm font-medium">
      <div className="text-slate-500">{icon}</div>
      <span>{text}</span>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
  );
}
