"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BadgeCheck,
  AlertTriangle,
  Info,
  RefreshCw,
  Calculator,
  DollarSign,
  ArrowRightLeft,
  Minus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Shield
} from "lucide-react";
import { RiskCalculator } from "@/components/risk-management/risk-calculator";

export default function RiskManagement() {
  // Mock data for risk calculator
  const aapl = {
    symbol: "AAPL",
    stockData: {
      price: 187.25,
      setupType: "bullish",
      iv: 32.5,
      gex: 750000,
      recommendation: {
        action: "Buy Calls",
        target: 198.50,
        stop: 182.75,
        expiration: "2023-06-15",
        strike: 190,
      },
    },
  };

  const meta = {
    symbol: "META",
    stockData: {
      price: 478.22,
      setupType: "bearish",
      iv: 44.7,
      gex: -650000,
      recommendation: {
        action: "Buy Puts",
        target: 455.00,
        stop: 490.00,
        expiration: "2023-06-22",
        strike: 475,
      },
    },
  };

  const msft = {
    symbol: "MSFT",
    stockData: {
      price: 417.86,
      setupType: "neutral",
      iv: 25.4,
      gex: 120000,
      recommendation: {
        action: "Sell Iron Condor",
        target: "50% of premium",
        stop: "200% of premium",
        expiration: "2023-06-15",
        strike: 420,
      },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-amber-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Protect capital with disciplined risk management rules
          </p>
        </div>
      </div>

      <Tabs defaultValue="position-sizing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="position-sizing" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            <span>Position Sizing</span>
          </TabsTrigger>
          <TabsTrigger value="stop-loss" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Stop Loss Strategy</span>
          </TabsTrigger>
          <TabsTrigger value="risk-reward" className="flex items-center gap-1">
            <ArrowRightLeft className="h-4 w-4" />
            <span>Risk/Reward Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="position-sizing" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <RiskCalculator
              symbol={aapl.symbol}
              stockData={aapl.stockData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="stop-loss" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stop Loss Strategy</CardTitle>
                <CardDescription>
                  Create optimal stop loss strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                Simplified stop loss content for debugging
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk-reward" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk/Reward Analysis</CardTitle>
                <CardDescription>
                  Evaluating trade opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                Simplified risk/reward content for debugging
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}