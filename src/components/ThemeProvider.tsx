'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  const storageKey = userEmail ? `theme_${userEmail}` : 'theme_guest';

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    let isDark = false;

    if (t === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = t === 'dark';
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Fetch logged in session to check user email for user-specific theme persistence
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const session = await res.json();
          if (session?.user?.email) {
            setUserEmail(session.user.email);
          }
        }
      } catch (err) {
        console.error('Failed to resolve theme session', err);
      } finally {
        setMounted(true);
      }
    }
    fetchSession();
  }, []);

  // Sync preference whenever storageKey is resolved/loaded
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem(storageKey) as Theme;
    if (saved) {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      setThemeState('system');
      applyTheme('system');
    }
  }, [storageKey, mounted]);

  // Listen to OS system media preferences dynamically
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
