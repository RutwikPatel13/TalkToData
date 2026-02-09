'use client';

import * as React from 'react';
import { Database, Moon, Sun, Plug, PlugZap, LogOut } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useConnection } from '@/hooks';
import { cn } from '@/lib/utils/cn';

interface NavbarProps {
  onConnectClick: () => void;
}

export function Navbar({ onConnectClick }: NavbarProps) {
  const { status, config, disconnect } = useConnection();
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme from localStorage on mount
  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Theme toggle effect
  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]);

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="success" className="gap-1.5">
            <PlugZap className="h-3 w-3" />
            {config?.database || 'Connected'}
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="warning" className="gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
            Connecting...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="error" className="gap-1.5">
            <Plug className="h-3 w-3" />
            Connection Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Plug className="h-3 w-3" />
            Not Connected
          </Badge>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-50">
            <Database className="h-5 w-5 text-white dark:text-neutral-900" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              TalkToData
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Query with natural language
            </p>
          </div>
        </div>

        {/* Center - Connection Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onConnectClick}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {getStatusBadge()}
          </button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {status === 'connected' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Disconnect
            </Button>
          )}

          <Button
            data-tour="connect-button"
            onClick={onConnectClick}
            variant={status === 'connected' ? 'outline' : 'default'}
          >
            {status === 'connected' ? 'Change Connection' : 'Connect Database'}
          </Button>
        </div>
      </div>
    </header>
  );
}

