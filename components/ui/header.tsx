"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-[color:var(--background)/0.6] border-b border-[color:var(--border)/0.6]">
      <div className="container mx-auto flex items-center justify-between gap-4 py-3 px-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle navigation"
            className="md:hidden p-2 rounded-md hover:bg-[color:var(--card)/0.06] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/">
            <span className="flex items-center gap-3 cursor-pointer">
              <div className="h-8 w-8 rounded-md bg-[color:var(--accent)] shadow-sm" />
              <span className="font-semibold text-lg">Options Scanner</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-4 text-sm text-[color:var(--muted-foreground)]">
          <Link href="/dashboard">
            <span className="hover:text-[color:var(--foreground)] transition">Dashboard</span>
          </Link>
          <Link href="/scanner">
            <span className="hover:text-[color:var(--foreground)] transition">Scanner</span>
          </Link>
          <Link href="/watchlist">
            <span className="hover:text-[color:var(--foreground)] transition">Watchlist</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/settings">
            <span className="hidden md:inline-block px-3 py-1 rounded-md text-sm bg-[color:var(--card)] hover:bg-[color:var(--card)/0.95]">
              Settings
            </span>
          </Link>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[color:var(--border)/0.6] bg-[color:var(--card)]">
          <div className="flex flex-col gap-2 p-3">
            <Link href="/dashboard">
              <span className="py-2 px-2 rounded hover:bg-[color:var(--card)/0.06]">Dashboard</span>
            </Link>
            <Link href="/scanner">
              <span className="py-2 px-2 rounded hover:bg-[color:var(--card)/0.06]">Scanner</span>
            </Link>
            <Link href="/watchlist">
              <span className="py-2 px-2 rounded hover:bg-[color:var(--card)/0.06]">Watchlist</span>
            </Link>
            <Link href="/settings">
              <span className="py-2 px-2 rounded hover:bg-[color:var(--card)/0.06]">Settings</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
