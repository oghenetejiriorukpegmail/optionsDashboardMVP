"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicalRulesVisualizer from "@/components/trade-setup/TechnicalRulesVisualizer";
import OptionsRulesVisualizer from "@/components/trade-setup/OptionsRulesVisualizer";

export default function TradeSetup() {
  // Sample data for the visualizations
  const [technicalData] = useState({
    dates: ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-07',
           '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11', '2025-04-14'],
    prices: [295.75, 297.25, 296.50, 298.80, 301.20, 303.50, 305.75, 307.25, 304.50, 306.75],
    ema10: [293.50, 294.25, 295.10, 296.30, 297.50, 298.80, 300.20, 301.60, 302.30, 303.10],
    ema20: [290.25, 291.10, 291.80, 292.60, 293.40, 294.30, 295.20, 296.10, 296.80, 297.60],
    ema50: [285.50, 286.20, 286.80, 287.40, 288.10, 288.80, 289.50, 290.20, 290.80, 291.50],
    rsi: [62.5, 65.2, 63.8, 67.1, 70.5, 72.3, 74.8, 76.5, 68.2, 71.5],
    volume: [12500000, 13200000, 11800000, 14500000, 18200000, 20500000, 19800000, 17500000, 16200000, 15800000],
  });

  const [optionsData] = useState({
    strikes: [
      {
        strike: 270,
        calls: { openInterest: 5800, volume: 950, iv: 42.5 },
        puts: { openInterest: 12500, volume: 2100, iv: 45.2 }
      },
      {
        strike: 280,
        calls: { openInterest: 7200, volume: 1250, iv: 40.8 },
        puts: { openInterest: 14800, volume: 2550, iv: 43.5 }
      },
      {
        strike: 290,
        calls: { openInterest: 9500, volume: 1850, iv: 38.2 },
        puts: { openInterest: 16200, volume: 3100, iv: 41.8 }
      },
      {
        strike: 300,
        calls: { openInterest: 15800, volume: 3550, iv: 36.5 },
        puts: { openInterest: 10500, volume: 2250, iv: 39.2 }
      },
      {
        strike: 310,
        calls: { openInterest: 18200, volume: 4200, iv: 38.8 },
        puts: { openInterest: 7800, volume: 1750, iv: 40.5 }
      },
      {
        strike: 320,
        calls: { openInterest: 12500, volume: 2850, iv: 40.2 },
        puts: { openInterest: 5200, volume: 1100, iv: 42.8 }
      },
      {
        strike: 330,
        calls: { openInterest: 8800, volume: 1650, iv: 42.5 },
        puts: { openInterest: 3500, volume: 780, iv: 45.2 }
      }
    ],
    currentPrice: 306.75,
    pcr: 0.75,
    ivPercentile: 45,
    ivSkew: 1.2,
    maxPain: 300,
    gex: 650000
  });

  // Technical rules data
  const bullishTechRules = {
    emaAlignment: true,
    rsiCondition: true,
    volumeTrend: true,
    priceBreakout: true
  };

  const bearishTechRules = {
    emaAlignment: false,
    rsiCondition: false,
    volumeTrend: true,
    priceBreakout: false
  };

  const neutralTechRules = {
    emaAlignment: false,
    rsiCondition: true,
    volumeTrend: false,
    priceBreakout: true
  };

  // Options rules data
  const bullishOptionsRules = {
    pcrThreshold: true,
    openInterestPattern: true,
    ivCondition: true,
    gexAlignment: true
  };

  const bearishOptionsRules = {
    pcrThreshold: false,
    openInterestPattern: true,
    ivCondition: false,
    gexAlignment: false
  };

  const neutralOptionsRules = {
    pcrThreshold: false,
    openInterestPattern: true,
    ivCondition: true,
    gexAlignment: true
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-green-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trade Setup Rules</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Define conditions for bullish, bearish, and neutral trading opportunities
          </p>
        </div>
      </div>

      <Tabs defaultValue="bullish" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bullish">Bullish Setups</TabsTrigger>
          <TabsTrigger value="bearish">Bearish Setups</TabsTrigger>
          <TabsTrigger value="neutral">Neutral Setups</TabsTrigger>
        </TabsList>

        <TabsContent value="bullish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Conditions</CardTitle>
              <CardDescription>
                Technical indicators for bullish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechnicalRulesVisualizer
                data={technicalData}
                setupType="bullish"
                rules={bullishTechRules}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options Conditions</CardTitle>
              <CardDescription>
                Options indicators for bullish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionsRulesVisualizer
                data={optionsData}
                setupType="bullish"
                rules={bullishOptionsRules}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bullish Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of bullish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Strong Bullish Setup: TSLA</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &gt; 20 EMA &gt; 50 EMA, RSI 65, Stochastic RSI 88</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.8, Call OI increasing at $310 strike, GEX +$600M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 22.5% above 20-day average, increasing on up days</p>
                  <p><span className="font-medium">Strategy:</span> Buy calls with $300 strike, 2-week expiration, target $310, stop at $295</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Moderate Bullish Setup: AAPL</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &gt; 20 EMA, 20 EMA ≈ 50 EMA, RSI 58, Stochastic RSI 65</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.85, Call volume increasing, GEX +$450M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 15% above 20-day average</p>
                  <p><span className="font-medium">Strategy:</span> Buy calls with $175 strike, 3-week expiration, target $180, stop at $172.50</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bearish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Conditions</CardTitle>
              <CardDescription>
                Technical indicators for bearish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechnicalRulesVisualizer
                data={technicalData}
                setupType="bearish"
                rules={bearishTechRules}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options Conditions</CardTitle>
              <CardDescription>
                Options indicators for bearish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionsRulesVisualizer
                data={optionsData}
                setupType="bearish"
                rules={bearishOptionsRules}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bearish Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of bearish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Strong Bearish Setup: META</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &lt; 20 EMA &lt; 50 EMA, RSI 38, Stochastic RSI 35</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.25, Put OI increasing at $300 strike, GEX -$350M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 18.7% above 20-day average, increasing on down days</p>
                  <p><span className="font-medium">Strategy:</span> Buy puts with $310 strike, 2-week expiration, target $300, stop at $315</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Moderate Bearish Setup: INTC</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &lt; 20 EMA, 20 EMA ≈ 50 EMA, RSI 42, Stochastic RSI 45</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.15, Put volume increasing, GEX -$120M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 12% above 20-day average</p>
                  <p><span className="font-medium">Strategy:</span> Buy puts with $32.5 strike, 3-week expiration, target $30, stop at $33.5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="neutral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Conditions</CardTitle>
              <CardDescription>
                Technical indicators for neutral setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechnicalRulesVisualizer
                data={technicalData}
                setupType="neutral"
                rules={neutralTechRules}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options Conditions</CardTitle>
              <CardDescription>
                Options indicators for neutral setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionsRulesVisualizer
                data={optionsData}
                setupType="neutral"
                rules={neutralOptionsRules}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Neutral Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of neutral setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Range-Bound Setup: MSFT</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> Flat EMAs, RSI 52, trading in $295-$305 range</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.95, high OI at $300 strike, GEX +$120M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 5.3% below 20-day average, decreasing</p>
                  <p><span className="font-medium">Strategy:</span> Sell $300 straddle, 2-week expiration, profit target 50% of premium, stop if price breaks $290/$310</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Pre-Earnings Setup: NVDA</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> Converging EMAs, RSI 58, consolidating before earnings</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.05, high IV at 52.3%, GEX +$80M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> Average volume, no clear direction</p>
                  <p><span className="font-medium">Strategy:</span> Sell iron condor with $850/$900 call spread and $825/$775 put spread, 2-week expiration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
