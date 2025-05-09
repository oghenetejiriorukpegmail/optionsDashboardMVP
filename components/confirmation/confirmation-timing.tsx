"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, LineChart, Target } from "lucide-react";
import { toast } from "../ui/sonner";
import { addToWatchlist } from "@/lib/api";

interface ConfirmationTimingProps {
  symbol: string;
  stockData: {
    price: number;
    setupType: string;
    emaTrend: string;
    pcr: number;
    rsi: number;
    stochasticRsi: number;
    iv: number;
    gex: number;
    volume: {
      current: number;
      percentChange: number;
    };
    keyLevels: {
      support: number[];
      resistance: number[];
      maxPain: number;
    };
    recommendation: {
      action: string;
      target: number | string;
      stop: number | string;
      expiration: string;
      strike: number;
    };
    historicalData: Array<{
      date: string;
      close: number;
      rsi: number;
      stochasticRsi: number;
      volume: number;
    }>;
  };
}

export function ConfirmationTiming({ symbol, stockData }: ConfirmationTimingProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'short' | 'medium' | 'long'>('short');
  
  // Get confirmation status
  const confirmationStatus = analyzeConfirmation(stockData);
  
  // Determine entry and exit triggers
  const entryTriggers = determineEntryTriggers(stockData);
  const exitTriggers = determineExitTriggers(stockData);
  
  // Check if all confirmation criteria are met
  const isConfirmed = confirmationStatus.filter(item => !item.status).length === 0;
  
  // Check if entry trigger is active
  const activeEntryTrigger = entryTriggers.find(trigger => trigger.active);
  
  // Determine timeframe-specific exit targets
  const exitTargets = {
    short: {
      target: typeof stockData.recommendation.target === 'number' 
        ? stockData.recommendation.target 
        : stockData.keyLevels.resistance[0],
      timeframe: '3-5 days'
    },
    medium: {
      target: typeof stockData.recommendation.target === 'number'
        ? stockData.recommendation.target * 1.05
        : stockData.keyLevels.resistance[1],
      timeframe: '1-2 weeks'
    },
    long: {
      target: typeof stockData.recommendation.target === 'number'
        ? stockData.recommendation.target * 1.1
        : stockData.keyLevels.resistance[1] * 1.05,
      timeframe: '3-4 weeks'
    }
  };
  
  // Function to add to watchlist with entry trigger
  const handleAddToWatchlist = async () => {
    try {
      const watchlistItem = {
        symbol,
        price: stockData.price,
        setupType: stockData.setupType,
        entryTarget: activeEntryTrigger ? activeEntryTrigger.price : stockData.price,
        stopLoss: typeof stockData.recommendation.stop === 'number'
          ? stockData.recommendation.stop
          : stockData.keyLevels.support[0],
        timeframe: selectedTimeframe,
        exitTarget: exitTargets[selectedTimeframe].target
      };
      
      const result = await addToWatchlist(watchlistItem);
      
      if (result.success) {
        toast.success(`${symbol} added to watchlist with entry trigger`);
      } else {
        toast.error(`Failed to add ${symbol} to watchlist`);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Confirmation & Timing for {symbol}</CardTitle>
            <CardDescription>
              Entry and exit signals for optimal trade timing
            </CardDescription>
          </div>
          <div>
            <Badge 
              variant={isConfirmed ? "default" : "outline"}
              className={`${
                isConfirmed ? 
                  (stockData.setupType === 'bullish' ? 'bg-green-600' : 
                  stockData.setupType === 'bearish' ? 'bg-red-600' : 
                  'bg-blue-600') : 
                  'text-muted-foreground'
              }`}
            >
              {isConfirmed ? 'Confirmed Setup' : 'Pending Confirmation'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="confirmation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
            <TabsTrigger value="entry">Entry Signals</TabsTrigger>
            <TabsTrigger value="exit">Exit Signals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="confirmation" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-2">Confirmation Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These criteria confirm the validity of the {stockData.setupType} trade setup.
              </p>
              
              <div className="space-y-4">
                {confirmationStatus.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {item.status ? 
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" /> : 
                      <XCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                    }
                    <div>
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.value && (
                        <p className={`text-xs mt-1 ${item.status ? 'text-green-600' : 'text-red-600'}`}>
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {isConfirmed ? (
                    <span className="text-sm text-green-600 font-medium">
                      Ready to Trade
                    </span>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium">
                      Waiting for Confirmation
                    </span>
                  )}
                </div>
                
                <Button 
                  variant={isConfirmed ? "default" : "outline"} 
                  size="sm"
                  onClick={handleAddToWatchlist}
                  disabled={!isConfirmed}
                >
                  {isConfirmed ? 'Add to Watchlist' : 'Awaiting Confirmation'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="entry" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Active Entry Signals</h3>
                
                {entryTriggers.some(trigger => trigger.active) ? (
                  <div className="space-y-3">
                    {entryTriggers
                      .filter(trigger => trigger.active)
                      .map((trigger, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium">{trigger.title}</h4>
                            <p className="text-xs text-muted-foreground">{trigger.description}</p>
                            {trigger.price && (
                              <p className="text-xs mt-1 text-green-600">
                                Entry Price: ${trigger.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    
                    <div className="mt-4 flex justify-center">
                      <Button 
                        onClick={handleAddToWatchlist}
                        className={stockData.setupType === 'bullish' ? 'bg-green-600 hover:bg-green-700' : 
                                 stockData.setupType === 'bearish' ? 'bg-red-600 hover:bg-red-700' : 
                                 'bg-blue-600 hover:bg-blue-700'}
                      >
                        {stockData.setupType === 'bullish' ? 'Enter Bullish Trade Now' : 
                         stockData.setupType === 'bearish' ? 'Enter Bearish Trade Now' : 
                         'Enter Neutral Trade Now'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                    <p className="text-sm text-center">No active entry signals at this time.</p>
                    <p className="text-xs text-muted-foreground text-center">
                      Monitor the potential entry triggers listed below.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Potential Entry Triggers</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Watch for these triggers to signal optimal entry timing.
                </p>
                
                <div className="space-y-3">
                  {entryTriggers
                    .filter(trigger => !trigger.active)
                    .map((trigger, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">{trigger.title}</h4>
                          <p className="text-xs text-muted-foreground">{trigger.description}</p>
                          {trigger.price && (
                            <p className="text-xs mt-1 text-amber-500">
                              Watch for price: ${trigger.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-2">Trade Timeframe Selection</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Select your preferred trading timeframe to optimize entry and exit points.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div 
                  className={`rounded-lg border p-3 cursor-pointer flex-1 ${
                    selectedTimeframe === 'short' ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedTimeframe('short')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Short-Term</h4>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">3-5 trading days</p>
                  <p className="text-xs mt-1">Best for quick momentum trades</p>
                </div>
                
                <div 
                  className={`rounded-lg border p-3 cursor-pointer flex-1 ${
                    selectedTimeframe === 'medium' ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedTimeframe('medium')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Medium-Term</h4>
                    <LineChart className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">1-2 weeks</p>
                  <p className="text-xs mt-1">Balanced risk/reward approach</p>
                </div>
                
                <div 
                  className={`rounded-lg border p-3 cursor-pointer flex-1 ${
                    selectedTimeframe === 'long' ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedTimeframe('long')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Long-Term</h4>
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">3-4 weeks</p>
                  <p className="text-xs mt-1">For capturing long-term trends</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Selected Timeframe Details</h4>
                  <Badge variant="outline">{selectedTimeframe}-term</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Target Price:</div>
                  <div>${exitTargets[selectedTimeframe].target.toFixed(2)}</div>
                  
                  <div className="text-muted-foreground">Expected Duration:</div>
                  <div>{exitTargets[selectedTimeframe].timeframe}</div>
                  
                  <div className="text-muted-foreground">Profit Potential:</div>
                  <div>
                    {(
                      ((exitTargets[selectedTimeframe].target - stockData.price) / stockData.price) * 100
                    ).toFixed(1)}%
                  </div>
                  
                  <div className="text-muted-foreground">Recommended Stop:</div>
                  <div>
                    ${typeof stockData.recommendation.stop === 'number' ? 
                      stockData.recommendation.stop.toFixed(2) : 
                      stockData.keyLevels.support[0].toFixed(2)
                    }
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="exit" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-2">Exit Signals</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These signals help determine when to exit a {stockData.setupType} trade.
              </p>
              
              <div className="space-y-4">
                {exitTriggers.map((trigger, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center
                      ${trigger.type === 'target' ? 'bg-green-100 text-green-600' : 
                        trigger.type === 'stop' ? 'bg-red-100 text-red-600' : 
                        'bg-amber-100 text-amber-600'}`}
                    >
                      {trigger.type === 'target' ? (
                        <Target className="h-3 w-3" />
                      ) : trigger.type === 'stop' ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{trigger.title}</h4>
                      <p className="text-xs text-muted-foreground">{trigger.description}</p>
                      {trigger.value && (
                        <p className={`text-xs mt-1 ${
                          trigger.type === 'target' ? 'text-green-600' : 
                          trigger.type === 'stop' ? 'text-red-600' : 
                          'text-amber-600'
                        }`}>
                          {trigger.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Profit Targets</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Exit levels to secure profits based on timeframe.
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-600 hover:bg-green-100">Short</Badge>
                      <span className="text-sm">${exitTargets.short.target.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((exitTargets.short.target - stockData.price) / stockData.price * 100).toFixed(1)}% gain
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-600 hover:bg-blue-100">Medium</Badge>
                      <span className="text-sm">${exitTargets.medium.target.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((exitTargets.medium.target - stockData.price) / stockData.price * 100).toFixed(1)}% gain
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-100 text-purple-600 hover:bg-purple-100">Long</Badge>
                      <span className="text-sm">${exitTargets.long.target.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((exitTargets.long.target - stockData.price) / stockData.price * 100).toFixed(1)}% gain
                    </div>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Note:</span> Consider trailing stops to protect profits as price approaches targets
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Stop Loss Levels</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Exit levels to limit losses based on risk tolerance.
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-100 text-red-600 hover:bg-red-100">Tight</Badge>
                      <span className="text-sm">
                        ${(stockData.price * 0.98).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      2.0% loss (high risk tolerance)
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-600 hover:bg-orange-100">Moderate</Badge>
                      <span className="text-sm">
                        ${typeof stockData.recommendation.stop === 'number' ? 
                            stockData.recommendation.stop.toFixed(2) : 
                            stockData.keyLevels.support[0].toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(Math.abs((
                        (typeof stockData.recommendation.stop === 'number' ? 
                          stockData.recommendation.stop : 
                          stockData.keyLevels.support[0]) - stockData.price) / stockData.price) * 100
                      ).toFixed(1)}% loss (medium risk tolerance)
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-600 hover:bg-amber-100">Wide</Badge>
                      <span className="text-sm">
                        ${(typeof stockData.recommendation.stop === 'number' ? 
                            stockData.recommendation.stop * 0.95 : 
                            stockData.keyLevels.support[0] * 0.95).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(Math.abs((
                        (typeof stockData.recommendation.stop === 'number' ? 
                          stockData.recommendation.stop * 0.95 : 
                          stockData.keyLevels.support[0] * 0.95) - stockData.price) / stockData.price) * 100
                      ).toFixed(1)}% loss (low risk tolerance)
                    </div>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Note:</span> Always set stop loss orders to protect capital from unexpected market moves
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-2">Exit Strategy Tips</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Scaling Out:</span> Consider exiting positions in portions (e.g., 1/3 at first target, 1/3 at second target, 1/3 at final target)
                </p>
                
                <p>
                  <span className="font-medium">Trailing Stops:</span> As price moves in your favor, gradually move your stop loss to lock in profits
                </p>
                
                <p>
                  <span className="font-medium">Technical Signals:</span> Watch for reversal patterns, divergences, or extreme RSI readings to exit before targets
                </p>
                
                <p>
                  <span className="font-medium">Time-Based Exits:</span> Consider exiting if the trade hasn't reached targets within the expected timeframe
                </p>
                
                <p>
                  <span className="font-medium">Volatility Expansion:</span> Be prepared to exit early if volatility increases dramatically (check VWIV/vomma)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to analyze confirmation criteria
function analyzeConfirmation(stockData: any) {
  // Default to bullish analysis unless setup type suggests otherwise
  const setupType = stockData.setupType;
  
  let confirmationItems = [];
  
  if (setupType === 'bullish') {
    // Bullish confirmation criteria
    confirmationItems = [
      {
        title: 'Stochastic RSI Hooks Up',
        description: 'Stochastic RSI turns upward from below 60',
        status: stockData.stochasticRsi < 60 && stochRsiTrend(stockData.historicalData) === 'up',
        value: `Stochastic RSI: ${stockData.stochasticRsi.toFixed(1)}, Trend: ${stochRsiTrend(stockData.historicalData)}`
      },
      {
        title: 'Volume Confirmation',
        description: 'Volume increases as price moves toward entry',
        status: stockData.volume.percentChange > 15,
        value: `Volume % Change: ${stockData.volume.percentChange.toFixed(1)}%`
      },
      {
        title: 'Rising Vanna/Vomma/GEX',
        description: 'Options metrics show increasing bullish sentiment',
        status: stockData.gex > 0 && stockData.gex > previousGEX(stockData),
        value: `GEX: ${formatGEX(stockData.gex)}, Previous: ${formatGEX(previousGEX(stockData))}`
      }
    ];
  } else if (setupType === 'bearish') {
    // Bearish confirmation criteria
    confirmationItems = [
      {
        title: 'Stochastic RSI Hooks Down',
        description: 'Stochastic RSI turns downward from above 40',
        status: stockData.stochasticRsi > 40 && stochRsiTrend(stockData.historicalData) === 'down',
        value: `Stochastic RSI: ${stockData.stochasticRsi.toFixed(1)}, Trend: ${stochRsiTrend(stockData.historicalData)}`
      },
      {
        title: 'Volume Confirmation',
        description: 'Volume increases as price moves toward entry',
        status: stockData.volume.percentChange > 15,
        value: `Volume % Change: ${stockData.volume.percentChange.toFixed(1)}%`
      },
      {
        title: 'Falling Vanna/Vomma/GEX',
        description: 'Options metrics show increasing bearish sentiment',
        status: stockData.gex < 0 && stockData.gex < previousGEX(stockData),
        value: `GEX: ${formatGEX(stockData.gex)}, Previous: ${formatGEX(previousGEX(stockData))}`
      }
    ];
  } else {
    // Neutral confirmation criteria
    confirmationItems = [
      {
        title: 'Price Stalling at Max Pain',
        description: 'Price consolidates near Max Pain level',
        status: Math.abs(stockData.price - stockData.keyLevels.maxPain) < (stockData.price * 0.02),
        value: `Price: $${stockData.price.toFixed(2)}, Max Pain: $${stockData.keyLevels.maxPain.toFixed(2)}`
      },
      {
        title: 'High Gamma / Stable GEX',
        description: 'High gamma at current strikes with low/stable GEX',
        status: Math.abs(stockData.gex) < 200000,
        value: `GEX: ${formatGEX(stockData.gex)}`
      },
      {
        title: 'Flat VWIV/Vomma',
        description: 'Implied volatility metrics steady across strikes',
        status: true, // Placeholder (would be based on actual vanna/vomma values)
        value: 'IV Metrics: Stable'
      }
    ];
  }
  
  return confirmationItems;
}

// Helper function to determine entry triggers
function determineEntryTriggers(stockData: any) {
  const setupType = stockData.setupType;
  
  if (setupType === 'bullish') {
    // Bullish entry triggers
    return [
      {
        title: 'Price Pulls Back to Support',
        description: 'Enter when price tests support level and bounces',
        active: isPriceNearLevel(stockData.price, stockData.keyLevels.support, 'support') && 
                stockData.price > stockData.historicalData[stockData.historicalData.length - 2].close,
        price: findNearestLevel(stockData.price, stockData.keyLevels.support, 'support')
      },
      {
        title: 'Stochastic RSI Crossover',
        description: 'Enter when Stochastic RSI crosses above 30 with upward momentum',
        active: stockData.stochasticRsi > 30 && 
                stockData.stochasticRsi < 60 && 
                stochRsiTrend(stockData.historicalData) === 'up',
        price: stockData.price
      },
      {
        title: 'Volume Spike with Price Strength',
        description: 'Enter on a volume spike with price closing near day high',
        active: stockData.volume.percentChange > 30,
        price: stockData.price
      }
    ];
  } else if (setupType === 'bearish') {
    // Bearish entry triggers
    return [
      {
        title: 'Price Rallies to Resistance',
        description: 'Enter when price tests resistance level and fails',
        active: isPriceNearLevel(stockData.price, stockData.keyLevels.resistance, 'resistance') && 
                stockData.price < stockData.historicalData[stockData.historicalData.length - 2].close,
        price: findNearestLevel(stockData.price, stockData.keyLevels.resistance, 'above')
      },
      {
        title: 'Stochastic RSI Crossover',
        description: 'Enter when Stochastic RSI crosses below 70 with downward momentum',
        active: stockData.stochasticRsi < 70 && 
                stockData.stochasticRsi > 40 && 
                stochRsiTrend(stockData.historicalData) === 'down',
        price: stockData.price
      },
      {
        title: 'Volume Spike with Price Weakness',
        description: 'Enter on a volume spike with price closing near day low',
        active: stockData.volume.percentChange > 30,
        price: stockData.price
      }
    ];
  } else {
    // Neutral entry triggers
    return [
      {
        title: 'Price Approaches Max Pain',
        description: 'Enter when price consolidates near Max Pain level',
        active: Math.abs(stockData.price - stockData.keyLevels.maxPain) < (stockData.price * 0.01),
        price: stockData.keyLevels.maxPain
      },
      {
        title: 'Stochastic RSI in Mid-Range',
        description: 'Enter when Stochastic RSI is between 40-60 with low volatility',
        active: stockData.stochasticRsi >= 40 && 
                stockData.stochasticRsi <= 60 && 
                stochRsiTrend(stockData.historicalData) === 'flat',
        price: stockData.price
      },
      {
        title: 'Low GEX & Vanna',
        description: 'Enter when GEX is near zero with balanced options activity',
        active: Math.abs(stockData.gex) < 100000,
        price: stockData.price
      }
    ];
  }
}

// Helper function to determine exit triggers
function determineExitTriggers(stockData: any) {
  const setupType = stockData.setupType;
  
  // Common exit triggers across all setup types
  const commonExits = [
    {
      title: 'Stop Loss Trigger',
      description: 'Exit when price breaks below key support level',
      type: 'stop',
      value: typeof stockData.recommendation.stop === 'number' ? 
        `$${stockData.recommendation.stop.toFixed(2)}` : 
        stockData.recommendation.stop
    }
  ];
  
  if (setupType === 'bullish') {
    // Bullish exit triggers
    return [
      {
        title: 'Target Price Reached',
        description: 'Exit when price reaches target resistance level',
        type: 'target',
        value: typeof stockData.recommendation.target === 'number' ? 
          `$${stockData.recommendation.target.toFixed(2)}` : 
          stockData.recommendation.target
      },
      {
        title: 'RSI Extreme',
        description: 'Exit when RSI reaches overbought level (above 80)',
        type: 'warning',
        value: 'RSI above 80'
      },
      {
        title: 'Stochastic RSI Reversal',
        description: 'Exit when Stochastic RSI hooks down from above 80',
        type: 'warning',
        value: 'Stochastic RSI turns down from above 80'
      },
      ...commonExits
    ];
  } else if (setupType === 'bearish') {
    // Bearish exit triggers
    return [
      {
        title: 'Target Price Reached',
        description: 'Exit when price reaches target support level',
        type: 'target',
        value: typeof stockData.recommendation.target === 'number' ? 
          `$${stockData.recommendation.target.toFixed(2)}` : 
          stockData.recommendation.target
      },
      {
        title: 'RSI Extreme',
        description: 'Exit when RSI reaches oversold level (below 20)',
        type: 'warning',
        value: 'RSI below 20'
      },
      {
        title: 'Stochastic RSI Reversal',
        description: 'Exit when Stochastic RSI hooks up from below 20',
        type: 'warning',
        value: 'Stochastic RSI turns up from below 20'
      },
      ...commonExits
    ];
  } else {
    // Neutral exit triggers
    return [
      {
        title: 'Premium Collection',
        description: 'Exit when 50% of premium is collected (for iron condors/credit spreads)',
        type: 'target',
        value: '50% of premium collected'
      },
      {
        title: 'Price Breaks Range',
        description: 'Exit when price breaks above/below expected range',
        type: 'stop',
        value: `Above $${stockData.keyLevels.resistance[0].toFixed(2)} or Below $${stockData.keyLevels.support[0].toFixed(2)}`
      },
      {
        title: 'Time Decay Completion',
        description: 'Exit as expiration approaches (last week)',
        type: 'warning',
        value: 'Within 5-7 days of expiration'
      },
      ...commonExits
    ];
  }
}

// Helper function to determine if price is near a specific level
function isPriceNearLevel(price: number, levels: number[], type: 'support' | 'resistance'): boolean {
  // For support, check if price is within 3% of any support level
  if (type === 'support') {
    return levels.some(level => price >= level && price <= level * 1.03);
  } 
  // For resistance, check if price is within 3% below any resistance level
  else {
    return levels.some(level => price <= level && price >= level * 0.97);
  }
}

// Helper function to find nearest level (support or resistance)
function findNearestLevel(price: number, levels: number[], direction: 'above' | 'below' | 'support' | 'resistance'): number {
  if (direction === 'below' || direction === 'support') {
    // Find the highest level below current price
    const belowLevels = levels.filter(level => level < price);
    return belowLevels.length > 0 ? Math.max(...belowLevels) : levels[0];
  } else {
    // Find the lowest level above current price
    const aboveLevels = levels.filter(level => level > price);
    return aboveLevels.length > 0 ? Math.min(...aboveLevels) : levels[levels.length - 1];
  }
}

// Helper function to determine Stochastic RSI trend
function stochRsiTrend(historicalData: any[]): 'up' | 'down' | 'flat' {
  const last5 = historicalData.slice(-5);
  
  if (last5.length < 3) return 'flat';
  
  const current = last5[last5.length - 1].stochasticRsi;
  const previous = last5[last5.length - 2].stochasticRsi;
  const twoBefore = last5[last5.length - 3].stochasticRsi;
  
  if (current > previous && previous >= twoBefore) return 'up';
  if (current < previous && previous <= twoBefore) return 'down';
  return 'flat';
}

// Helper function to get previous GEX value (simulation)
function previousGEX(stockData: any): number {
  // In a real implementation, this would retrieve historical GEX data
  // For simulation, we'll generate a value based on current GEX
  return stockData.gex * (0.8 + Math.random() * 0.4);
}

// Helper function to format GEX values
function formatGEX(gex: number): string {
  if (Math.abs(gex) >= 1000000) {
    return `${(gex / 1000000).toFixed(2)}M`;
  } else if (Math.abs(gex) >= 1000) {
    return `${(gex / 1000).toFixed(2)}K`;
  }
  return gex.toFixed(2);
}