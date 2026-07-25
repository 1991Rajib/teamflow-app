import re

with open('src/components/TenantSwitcher.tsx', 'r') as f:
    content = f.read()

# Update Props Interface
props_start = """interface TenantSwitcherProps {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantLogo?: string;
  onSwitch?: () => void;
}"""

props_replacement = """interface TenantSwitcherProps {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantLogo?: string;
  onSwitch?: () => void;
  isCollapsed?: boolean;
}"""

content = content.replace(props_start, props_replacement)

# Update Props destructuring
destruct_start = """export default function TenantSwitcher({
  currentTenantId,
  currentTenantName,
  currentTenantLogo,
  onSwitch,
}: TenantSwitcherProps) {"""

destruct_replacement = """export default function TenantSwitcher({
  currentTenantId,
  currentTenantName,
  currentTenantLogo,
  onSwitch,
  isCollapsed = false,
}: TenantSwitcherProps) {"""

content = content.replace(destruct_start, destruct_replacement)

# Update Button
button_start = """      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select workspace"
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 transition duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {currentTenantLogo ? (
            <img src={currentTenantLogo} className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Building className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition duration-150">
            {currentTenantName}
          </span>
        </div>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition duration-150 flex-shrink-0" />
        )}
      </button>"""

button_replacement = """      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select workspace"
        className={`w-full flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 transition duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer group ${
          isCollapsed ? 'justify-center p-2 rounded-lg' : 'justify-between gap-3 px-3 py-2 rounded-xl'
        }`}
      >
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          {currentTenantLogo ? (
            <img src={currentTenantLogo} className={`rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
          ) : (
            <div className={`rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 ${isCollapsed ? 'w-7 h-7' : 'w-5 h-5'}`}>
              <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          {!isCollapsed && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition duration-150">
              {currentTenantName}
            </span>
          )}
        </div>
        {!isCollapsed && (
          loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition duration-150 flex-shrink-0" />
          )
        )}
      </button>"""

content = content.replace(button_start, button_replacement)

with open('src/components/TenantSwitcher.tsx', 'w') as f:
    f.write(content)
