"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BadgeCheck, AlertTriangle, Info, RefreshCw, Calculator, DollarSign, ArrowRightLeft, Minus, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { RiskCalculator } from "@/components/risk-management/risk-calculator";
import { fetchScannerResults } from "@/lib/api";
import { TickerSelector } from "@/components/ui/ticker-selector";

interface RiskManagementClientProps {
  ticker?: string;
}

export function RiskManagementClient({ ticker }: RiskManagementClientProps) {
  const [selectedTicker, setSelectedTicker] = useState(ticker || '');
  const [stockData, setStockData] = useState<any>(null);
  const symbol = selectedTicker || ticker || 'AAPL';

  useEffect(() => {
    if (selectedTicker) {
      fetchTickerData();
    }
  }, [selectedTicker]);

  const fetchTickerData = async () => {
    try {
      const data = await fetchScannerResults({ symbol });
      if (data.setup) {
        setStockData({
          price: data.setup.price || 187.25,
          setupType: data.setup.setupType || 'neutral',
          iv: 32.5, // Default IV
          gex: 0, // Not available in scanner data
          recommendation: {
            action: data.setup.setupType === 'bullish' ? 'Buy Calls' : 
                    data.setup.setupType === 'bearish' ? 'Buy Puts' : 'Hold',
            target: data.setup.targetPrice || 'N/A',
            stop: data.setup.stopLoss || 'N/A',
            expiration: '30 DTE',
            strike: data.setup.entryPrice || 190,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      // Use default data on error
      setStockData({
        price: 187.25,
        setupType: "bullish",
        iv: 32.5,
        gex: 750000,
        recommendation: {
          action: "Buy Calls",
          target: 198.50,
          stop: 182.75,
          expiration: "30 DTE",
          strike: 190,
        },
      });
    }
  };

  if (!selectedTicker && !ticker) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <TickerSelector 
            value={selectedTicker}
            onValueChange={setSelectedTicker}
            placeholder="Select ticker..."
          />
          <p className="text-muted-foreground">Select a ticker to view risk management analysis</p>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <TickerSelector 
          value={selectedTicker}
          onValueChange={setSelectedTicker}
          placeholder="Select ticker..."
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{symbol} Risk Management</h1>
          <p className="text-muted-foreground">
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
              symbol={symbol}
              stockData={stockData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="stop-loss" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stop Loss Strategy</CardTitle>
                <CardDescription>
                  Optimal stop loss placement for {symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold">Stop Loss Level</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${typeof stockData.recommendation.stop === 'number' 
                        ? stockData.recommendation.stop.toFixed(2) 
                        : stockData.recommendation.stop}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {typeof stockData.recommendation.stop === 'number' 
                        ? `${((stockData.price - stockData.recommendation.stop) / stockData.price * 100).toFixed(1)}% below current price`
                        : 'Based on technical levels'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Stop Loss Rules</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Never risk more than 2% of account per trade
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Place stops below key support levels
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Use trailing stops to protect profits
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Honor stops without exception
                      </li>
                    </ul>
                  </div>
                </div>
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
                  Trade opportunity evaluation for {symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Entry Price</div>
                      <div className="text-xl font-bold">${stockData.price.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Target Price</div>
                      <div className="text-xl font-bold text-green-500">
                        ${typeof stockData.recommendation.target === 'number' 
                          ? stockData.recommendation.target.toFixed(2) 
                          : stockData.recommendation.target}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Stop Loss</div>
                      <div className="text-xl font-bold text-red-500">
                        ${typeof stockData.recommendation.stop === 'number' 
                          ? stockData.recommendation.stop.toFixed(2) 
                          : stockData.recommendation.stop}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Risk/Reward Ratio</span>
                      <span className="text-2xl font-bold">
                        {typeof stockData.recommendation.target === 'number' && 
                         typeof stockData.recommendation.stop === 'number' 
                          ? ((stockData.recommendation.target - stockData.price) / 
                             (stockData.price - stockData.recommendation.stop)).toFixed(2) + ':1'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Minimum Ratio</AlertTitle>
                    <AlertDescription>
                      Only take trades with risk/reward ratio of 2:1 or better
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}