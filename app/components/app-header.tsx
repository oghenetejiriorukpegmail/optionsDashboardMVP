"use client";

import Link from 'next/link';
import { BarChart3, Settings, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <header className="border-b bg-gradient-to-r from-background via-background to-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">Options-Technical Hybrid</h1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/scanner" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Scanner
            </Link>
            <Link href="/market-context" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Market Context
            </Link>
            <Link href="/guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Guide
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/scanner">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
