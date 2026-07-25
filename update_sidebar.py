import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace("import Link from 'next/link';", "import { useState } from 'react';\nimport Link from 'next/link';")
content = content.replace("import { LayoutDashboard, FolderKanban, ListTodo, Users, CreditCard, Settings, LogOut, Shield } from 'lucide-react';", "import { LayoutDashboard, FolderKanban, ListTodo, Users, CreditCard, Settings, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';")

# Add state
content = content.replace("const pathname = usePathname();", "const pathname = usePathname();\n  const [isCollapsed, setIsCollapsed] = useState(false);")

# Replace <aside> start and toggle button
aside_start = """    <aside className={`flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full ${className}`}>
      {/* Header / Brand */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base">
            TF
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TeamFlow</span>
        </div>
      </div>"""

aside_replacement = """    <aside className={`flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full relative transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} ${className}`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-6 items-center justify-center w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full z-50 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-transform hover:scale-110 outline-none"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header / Brand */}
      <div className={`py-5 flex items-center border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base flex-shrink-0">
            TF
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TeamFlow</span>}
        </div>
      </div>"""

content = content.replace(aside_start, aside_replacement)

# Replace Switcher Context
switcher_start = """      {/* Switcher Context */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <TenantSwitcher
          currentTenantId={currentTenantId}
          currentTenantName={currentTenantName}
          currentTenantLogo={currentTenantLogo}
          onSwitch={onLinkClick}
        />
      </div>"""

switcher_replacement = """      {/* Switcher Context */}
      <div className={`py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${isCollapsed ? 'px-2' : 'px-5'}`}>
        <TenantSwitcher
          currentTenantId={currentTenantId}
          currentTenantName={currentTenantName}
          currentTenantLogo={currentTenantLogo}
          onSwitch={onLinkClick}
          isCollapsed={isCollapsed}
        />
      </div>"""

content = content.replace(switcher_start, switcher_replacement)

# Replace Nav Links
nav_start = """      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
        {platformRole === 'PLATFORM_ADMIN' && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-sm font-semibold transition duration-200 border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            Platform Admin
          </Link>
        )}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>"""

nav_replacement = """      {/* Nav Links */}
      <nav className={`flex-1 py-4 flex flex-col gap-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {platformRole === 'PLATFORM_ADMIN' && (
          <Link
            href="/admin"
            title={isCollapsed ? "Platform Admin" : undefined}
            className={`flex items-center mb-2 rounded-lg text-sm font-semibold transition duration-200 border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 ${
              isCollapsed ? 'justify-center p-2.5 gap-0' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            {!isCollapsed && "Platform Admin"}
          </Link>
        )}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isCollapsed ? 'justify-center p-2.5 gap-0' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>"""

content = content.replace(nav_start, nav_replacement)

# Replace Footer
footer_start = """      {/* User Info footer for Desktop sidebar */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {currentTenantLogo ? (
            <img src={currentTenantLogo} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 uppercase flex-shrink-0">
              {userName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer flex-shrink-0"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>"""

footer_replacement = """      {/* User Info footer for Desktop sidebar */}
      <div className={`py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 flex-shrink-0 flex items-center justify-between ${
        isCollapsed ? 'flex-col gap-4 px-2' : 'gap-3 px-5'
      }`}>
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {currentTenantLogo ? (
            <img src={currentTenantLogo} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 uppercase flex-shrink-0">
              {userName.charAt(0)}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer flex-shrink-0 ${
            isCollapsed ? 'w-full flex justify-center' : ''
          }`}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>"""

content = content.replace(footer_start, footer_replacement)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
