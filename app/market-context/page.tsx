"use client";

import { MarketContextDashboard } from './components/market-context-dashboard';

export default function MarketContextPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Market Context Analysis</h1>
        <p className="text-muted-foreground">
          Analyze market context using technical indicators and options data
        </p>
      </div>
      
      <MarketContextDashboard />
    </div>
  );
}
