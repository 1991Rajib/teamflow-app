'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Building, Check, Loader2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  logo?: string;
}

interface TenantSwitcherProps {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantLogo?: string;
  onSwitch?: () => void;
  isCollapsed?: boolean;
}

export default function TenantSwitcher({
  currentTenantId,
  currentTenantName,
  currentTenantLogo,
  onSwitch,
  isCollapsed = false,
}: TenantSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingToId, setSwitchingToId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const response = await fetch('/api/tenants');
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data.workspaces || []);
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    }
    fetchWorkspaces();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === currentTenantId) return;

    setLoading(true);
    setSwitchingToId(tenantId);
    setIsOpen(false);

    let switched = false;
    try {
      const response = await fetch('/api/tenants/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        switched = true;
        if (onSwitch) {
          onSwitch();
        }
        window.location.reload();
      } else {
        console.error('Failed to switch workspace');
      }
    } catch (err) {
      console.error('Error switching workspace:', err);
    } finally {
      if (!switched) {
        setLoading(false);
        setSwitchingToId(null);
      }
    }
  };

  return (
    <div className="relative font-sans w-full" ref={dropdownRef}>
      <button
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
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-100"
        >
          <div className="px-2.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Switch Workspace
          </div>

          <div className="flex flex-col max-h-48 overflow-y-auto gap-0.5">
            {workspaces.map((ws) => {
              const isActive = ws.id === currentTenantId;
              const isSwitching = switchingToId === ws.id;

              return (
                <button
                  key={ws.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSwitch(ws.id)}
                  disabled={loading}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm text-left transition select-none outline-none cursor-pointer disabled:opacity-50 font-medium ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {ws.logo ? (
                      <img src={ws.logo} className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Building className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                      </div>
                    )}
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSwitching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-blue-400" />
                  ) : isActive ? (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 my-1.5"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/onboarding');
            }}
            disabled={loading}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs text-left text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer disabled:opacity-50 font-medium"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Create Workspace
          </button>
        </div>
      )}
    </div>
  );
}
