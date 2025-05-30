"use client";

import { RiskManagementClient } from "@/components/risk-management/risk-management-client";
import { Shield } from "lucide-react";

export default function RiskManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-red-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Protect capital with disciplined risk management rules
          </p>
        </div>
      </div>

      <RiskManagementClient />
    </div>
  );
}