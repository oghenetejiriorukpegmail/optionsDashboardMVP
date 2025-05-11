"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ConfirmationTiming } from "@/components/confirmation/confirmation-timing";

export default function Confirmation() {
  // Mock data for confirmation component
  const mockTrade = {
    symbol: "AAPL",
    tradeData: {
      price: 187.25,
      setupType: "bullish",
      entrySignals: {
        technicalConfirmation: {
          stochasticRsiHook: true,
          volumeSpike: true,
          priceAction: true,
          macdCrossover: false,
        },
        optionsConfirmation: {
          increasingOpenInterest: true,
          optionsFlow: true,
          gammaRamp: false,
          ivPattern: true,
        },
      },
      exitSignals: {
        technicalTriggers: {
          targetReached: false,
          rsiExtreme: false,
          stochasticRsiReversal: false,
          pricePattern: false,
        },
        optionsTriggers: {
          gammaFlip: false,
          optionsFlowReversal: false,
          ivCrush: false,
          openInterestDrop: false,
        },
      },
      recommendation: {
        action: "Buy Calls",
        entryPrice: 187.25,
        targetPrice: 198.50,
        stopLoss: 182.75,
        optimalTiming: "Market Open",
        expectedDuration: "2 weeks",
      },
    },
  };

  const mockTradeNeutral = {
    symbol: "MSFT",
    tradeData: {
      price: 417.86,
      setupType: "neutral",
      entrySignals: {
        technicalConfirmation: {
          stochasticRsiHook: true,
          volumeSpike: false,
          priceAction: true,
          macdCrossover: false,
        },
        optionsConfirmation: {
          increasingOpenInterest: true,
          optionsFlow: false,
          gammaRamp: true,
          ivPattern: true,
        },
      },
      exitSignals: {
        technicalTriggers: {
          targetReached: false,
          rsiExtreme: false,
          stochasticRsiReversal: false,
          pricePattern: false,
        },
        optionsTriggers: {
          gammaFlip: false,
          optionsFlowReversal: false,
          ivCrush: false,
          openInterestDrop: false,
        },
      },
      recommendation: {
        action: "Sell Iron Condor",
        entryPrice: 417.86,
        targetPrice: 425.00,
        stopLoss: 405.00,
        optimalTiming: "After Earnings",
        expectedDuration: "3 weeks",
      },
    },
  };

  const mockTradeBearish = {
    symbol: "META",
    tradeData: {
      price: 478.22,
      setupType: "bearish",
      entrySignals: {
        technicalConfirmation: {
          stochasticRsiHook: true,
          volumeSpike: true,
          priceAction: false,
          macdCrossover: true,
        },
        optionsConfirmation: {
          increasingOpenInterest: false,
          optionsFlow: true,
          gammaRamp: true,
          ivPattern: true,
        },
      },
      exitSignals: {
        technicalTriggers: {
          targetReached: false,
          rsiExtreme: true,
          stochasticRsiReversal: true,
          pricePattern: false,
        },
        optionsTriggers: {
          gammaFlip: true,
          optionsFlowReversal: false,
          ivCrush: false,
          openInterestDrop: true,
        },
      },
      recommendation: {
        action: "Buy Puts",
        entryPrice: 478.22,
        targetPrice: 450.00,
        stopLoss: 490.00,
        optimalTiming: "Market Close",
        expectedDuration: "2 weeks",
      },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-purple-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Confirmation & Timing</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Ensure precise entries and exits with confirmation signals
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ConfirmationTiming
          symbol={mockTrade.symbol}
          tradeData={mockTrade.tradeData}
        />

        <ConfirmationTiming
          symbol={mockTradeBearish.symbol}
          tradeData={mockTradeBearish.tradeData}
        />

        <ConfirmationTiming
          symbol={mockTradeNeutral.symbol}
          tradeData={mockTradeNeutral.tradeData}
        />
      </div>
    </div>
  );
}
