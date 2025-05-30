"use client";

import { ThemeProvider } from "next-themes";
import { AppHeader } from "./components/app-header";
import { Toaster } from "@/components/ui/toaster";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex-1">
          <main className="container py-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}