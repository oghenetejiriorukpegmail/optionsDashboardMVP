"use client";

import { ConfirmationTiming } from "@/components/confirmation/confirmation-timing";
import { Clock } from "lucide-react";

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trade Confirmation & Timing</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Entry and exit signals for optimal trade timing
          </p>
        </div>
      </div>

      <ConfirmationTiming />
    </div>
  );
}