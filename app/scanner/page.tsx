"use client";

import { ScannerDashboard } from './components/scanner-dashboard';

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Options-Technical Hybrid Scanner</h1>
        <p className="text-muted-foreground">
          Identify trading opportunities using the Options-Technical Hybrid Strategy
        </p>
      </div>
      
      <ScannerDashboard />
    </div>
  );
}
