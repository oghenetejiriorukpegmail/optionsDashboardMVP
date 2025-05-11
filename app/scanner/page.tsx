"use client";

import { ScannerDashboard } from './components/scanner-dashboard';
import { Search } from 'lucide-react';

export default function ScannerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-sky-500/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-sky-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Options-Technical Hybrid Scanner</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Identify trading opportunities using the Options-Technical Hybrid Strategy
          </p>
        </div>
      </div>

      <ScannerDashboard />
    </div>
  );
}
