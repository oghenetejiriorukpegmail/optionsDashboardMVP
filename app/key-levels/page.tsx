"use client";

import { KeyLevelsMapping } from "@/components/key-levels/key-levels-mapping";
import { LineChart } from "lucide-react";

export default function KeyLevelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-purple-500/10 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-purple-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Key Support & Resistance Levels</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Identify critical price levels using options flow and volume analysis
          </p>
        </div>
      </div>

      <KeyLevelsMapping />
    </div>
  );
}