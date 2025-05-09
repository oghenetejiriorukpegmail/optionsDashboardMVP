"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Settings, 
  Share2, 
  Zap,
  Activity,
  Bookmark,
  Eye,
  ChevronRight
} from "lucide-react";
import { addToWatchlist } from "@/lib/api";
import { toast } from "../ui/sonner";
import { cn } from "@/lib/utils";

interface TradeSetupRulesProps {
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
  };
}

export function TradeSetupRules({ symbol, stockData }: TradeSetupRulesProps) {
  const [customRules, setCustomRules] = useState({
    emaAlignment: true,
    pcrThreshold: true,
    rsiRange: true,
    priceNearSupport: true,
    positiveGEX: stockData.setupType === 'bullish',
    highVanna: true
  });
  
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>('standard');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  
  // Evaluate the current stock against rules for each setup type
  const bullishRulesStatus = {
    emaAlignment: stockData.emaTrend === '10 > 20 > 50',
    pcrThreshold: stockData.pcr < (stockData.iv > 50 ? 0.5 : stockData.iv > 30 ? 0.8 : 0.7),
    rsiRange: stockData.rsi >= 55 && stockData.rsi <= 80,
    stochRsiThreshold: stockData.stochasticRsi > 60,
    priceNearSupport: isPriceNearLevel(stockData.price, stockData.keyLevels.support, 'support'),
    positiveGEX: stockData.gex > 500000,
    highVanna: true // Placeholder (would be based on actual vanna values)
  };
  
  const bearishRulesStatus = {
    emaAlignment: stockData.emaTrend === '10 < 20 < 50',
    pcrThreshold: stockData.pcr > (stockData.iv > 50 ? 1.5 : stockData.iv > 30 ? 1.2 : 1.3),
    rsiRange: stockData.rsi >= 20 && stockData.rsi <= 45,
    stochRsiThreshold: stockData.stochasticRsi < 40,
    priceNearResistance: isPriceNearLevel(stockData.price, stockData.keyLevels.resistance, 'resistance'),
    negativeGEX: stockData.gex < -500000,
    highVanna: true // Placeholder (would be based on actual vanna values)
  };
  
  const neutralRulesStatus = {
    flatEMAs: stockData.emaTrend.includes('>') && stockData.emaTrend.includes('<'),
    pcrThreshold: stockData.pcr >= 0.8 && stockData.pcr <= 1.2,
    lowIV: stockData.iv < 40,
    rsiRange: stockData.rsi >= 45 && stockData.rsi <= 65,
    stochRsiRange: stockData.stochasticRsi >= 25 && stockData.stochasticRsi <= 75,
    priceNearMaxPain: Math.abs(stockData.price - stockData.keyLevels.maxPain) < (stockData.price * 0.02),
    lowGEX: Math.abs(stockData.gex) < 200000
  };
  
  // Calculate match percentages for setup types
  const bullishMatchPercent = calculateMatchPercent(bullishRulesStatus);
  const bearishMatchPercent = calculateMatchPercent(bearishRulesStatus);
  const neutralMatchPercent = calculateMatchPercent(neutralRulesStatus);
  
  // Determine best setup type based on match percentage
  const bestSetup = [
    { type: 'bullish', percent: bullishMatchPercent },
    { type: 'bearish', percent: bearishMatchPercent },
    { type: 'neutral', percent: neutralMatchPercent }
  ].sort((a, b) => b.percent - a.percent)[0];
  
  // Check if current stock's setupType matches the calculated best setup
  const setupTypeMatches = stockData.setupType === bestSetup.type;
  
  // Evaluate custom rules based on selected setup type
  const customRulesStatus = evaluateCustomRules(stockData, customRules);
  const customRulesMatchPercent = calculateMatchPercent(customRulesStatus);
  
  // Function to add stock to watchlist
  const handleAddToWatchlist = async () => {
    try {
      setAddingToWatchlist(true);
      
      const watchlistItem = {
        symbol,
        price: stockData.price,
        setupType: stockData.setupType,
        entryTarget: typeof stockData.recommendation.target === 'number' 
          ? stockData.recommendation.target 
          : stockData.price,
        stopLoss: typeof stockData.recommendation.stop === 'number'
          ? stockData.recommendation.stop
          : stockData.keyLevels.support[0]
      };
      
      const result = await addToWatchlist(watchlistItem);
      
      if (result.success) {
        toast.success(`${symbol} added to watchlist`);
      } else {
        toast.error(`Failed to add ${symbol} to watchlist`);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(false);
    }
  };

  // Helper function to get setup icon by type
  const getSetupIcon = (type: string) => {
    switch (type) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Helper function to get setup color class by type
  const getSetupColorClass = (type: string, dark: boolean = false) => {
    switch (type) {
      case 'bullish':
        return dark ? 'text-green-400' : 'text-green-600';
      case 'bearish':
        return dark ? 'text-red-400' : 'text-red-600';
      case 'neutral':
        return dark ? 'text-blue-400' : 'text-blue-600';
      default:
        return '';
    }
  };

  // Helper function to get setup bg color class by type
  const getSetupBgClass = (type: string) => {
    switch (type) {
      case 'bullish':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bearish':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
      <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
      
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Trade Setup Rules
            </CardTitle>
            <CardDescription>
              Evaluate {symbol} against bullish, bearish, and neutral criteria
            </CardDescription>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Best Match:</span>
              <Badge 
                className={cn(
                  "flex items-center gap-1",
                  getSetupBgClass(bestSetup.type)
                )}
              >
                {getSetupIcon(bestSetup.type)}
                {bestSetup.type.charAt(0).toUpperCase() + bestSetup.type.slice(1)} ({bestSetup.percent}%)
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToWatchlist}
              disabled={addingToWatchlist}
              className="gap-2"
            >
              {addingToWatchlist ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  Adding...
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bullish" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Bullish</span>
              <span className="sm:hidden">Bullish</span>
            </TabsTrigger>
            <TabsTrigger value="bearish" className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">Bearish</span>
              <span className="sm:hidden">Bearish</span>
            </TabsTrigger>
            <TabsTrigger value="neutral" className="flex items-center gap-1">
              <Minus className="h-4 w-4" />
              <span className="hidden sm:inline">Neutral</span>
              <span className="sm:hidden">Neutral</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    Setup Type Match
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Bullish:</span>
                        </div>
                        <span className="text-sm font-mono">{bullishMatchPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${bullishMatchPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Bearish:</span>
                        </div>
                        <span className="text-sm font-mono">{bearishMatchPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-red-500 rounded-full" 
                          style={{ width: `${bearishMatchPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Minus className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Neutral:</span>
                        </div>
                        <span className="text-sm font-mono">{neutralMatchPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${neutralMatchPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">Alignment:</span>
                      {setupTypeMatches ? (
                        <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                          Matches current setup
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">
                          Different from current setup
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    Current Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
                      <span className="text-sm font-medium">Setup Type:</span>
                      <Badge 
                        className={cn(
                          "flex items-center gap-1",
                          getSetupBgClass(stockData.setupType)
                        )}
                      >
                        {getSetupIcon(stockData.setupType)}
                        {stockData.setupType.charAt(0).toUpperCase() + stockData.setupType.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">EMA Trend:</span>
                      <span className="text-sm font-mono">{stockData.emaTrend}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Put-Call Ratio:</span>
                      <span className={`text-sm font-mono ${
                        stockData.pcr < 0.7 ? 'text-green-600 dark:text-green-400' : 
                        stockData.pcr > 1.3 ? 'text-red-600 dark:text-red-400' : ''
                      }`}>{stockData.pcr.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">RSI (14):</span>
                      <span className={`text-sm font-mono ${
                        stockData.rsi > 70 ? 'text-red-600 dark:text-red-400' : 
                        stockData.rsi < 30 ? 'text-green-600 dark:text-green-400' : ''
                      }`}>{stockData.rsi.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Stochastic RSI:</span>
                      <span className={`text-sm font-mono ${
                        stockData.stochasticRsi > 80 ? 'text-red-600 dark:text-red-400' : 
                        stockData.stochasticRsi < 20 ? 'text-green-600 dark:text-green-400' : ''
                      }`}>{stockData.stochasticRsi.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Implied Volatility:</span>
                      <span className={`text-sm font-mono ${
                        stockData.iv > 50 ? 'text-red-600 dark:text-red-400' : 
                        stockData.iv < 20 ? 'text-green-600 dark:text-green-400' : ''
                      }`}>{stockData.iv.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardHeader className="pb-2 relative">
                  <div className={`absolute -left-0 top-0 bottom-0 w-1 rounded-tl-md rounded-bl-md ${
                    stockData.recommendation.action.toLowerCase().includes('buy') ? 'bg-green-500' :
                    stockData.recommendation.action.toLowerCase().includes('sell') ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}></div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
                      <span className="text-sm font-medium">Action:</span>
                      <span className={`text-sm font-semibold ${
                        stockData.recommendation.action.toLowerCase().includes('buy') ? 'text-green-600 dark:text-green-400' :
                        stockData.recommendation.action.toLowerCase().includes('sell') ? 'text-red-600 dark:text-red-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>{stockData.recommendation.action}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Entry Target:</span>
                      <span className="text-sm font-mono">
                        {typeof stockData.recommendation.target === 'number' ? 
                          `$${stockData.recommendation.target.toFixed(2)}` : 
                          stockData.recommendation.target}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Stop Loss:</span>
                      <span className="text-sm font-mono text-red-600 dark:text-red-400">
                        {typeof stockData.recommendation.stop === 'number' ? 
                          `$${stockData.recommendation.stop.toFixed(2)}` : 
                          stockData.recommendation.stop}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Expiration:</span>
                      <span className="text-sm font-mono">
                        {new Date(stockData.recommendation.expiration).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-sm font-medium">Strike:</span>
                      <span className="text-sm font-mono">${stockData.recommendation.strike.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Custom Trade Setup Rules
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="view-mode" className="text-sm">Advanced View</Label>
                    <Switch 
                      id="view-mode" 
                      checked={viewMode === 'advanced'}
                      onCheckedChange={(checked) => setViewMode(checked ? 'advanced' : 'standard')}
                    />
                  </div>
                </div>
                <CardDescription>
                  Customize which criteria to include in your trade setup analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="ema-alignment"
                        checked={customRules.emaAlignment}
                        onCheckedChange={(checked) => setCustomRules({...customRules, emaAlignment: checked})}
                      />
                      <Label htmlFor="ema-alignment" className="flex items-center gap-1.5">
                        <span>EMA Alignment</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.emaAlignment ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="pcr-threshold"
                        checked={customRules.pcrThreshold}
                        onCheckedChange={(checked) => setCustomRules({...customRules, pcrThreshold: checked})}
                      />
                      <Label htmlFor="pcr-threshold" className="flex items-center gap-1.5">
                        <span>PCR Threshold</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.pcrThreshold ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="rsi-range"
                        checked={customRules.rsiRange}
                        onCheckedChange={(checked) => setCustomRules({...customRules, rsiRange: checked})}
                      />
                      <Label htmlFor="rsi-range" className="flex items-center gap-1.5">
                        <span>RSI Range</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.rsiRange ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="price-near-support"
                        checked={customRules.priceNearSupport}
                        onCheckedChange={(checked) => setCustomRules({...customRules, priceNearSupport: checked})}
                      />
                      <Label htmlFor="price-near-support" className="flex items-center gap-1.5">
                        <span>Price Near Key Level</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.priceNearLevel ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="positive-gex"
                        checked={customRules.positiveGEX}
                        onCheckedChange={(checked) => setCustomRules({...customRules, positiveGEX: checked})}
                      />
                      <Label htmlFor="positive-gex" className="flex items-center gap-1.5">
                        <span>Favorable GEX</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.gexAlignment ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                      <Switch
                        id="high-vanna"
                        checked={customRules.highVanna}
                        onCheckedChange={(checked) => setCustomRules({...customRules, highVanna: checked})}
                      />
                      <Label htmlFor="high-vanna" className="flex items-center gap-1.5">
                        <span>High Vanna/Vomma</span>
                        {viewMode === 'advanced' && (
                          <div className="ml-1">
                            {customRulesStatus.highVanna ? 
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Custom Rules Match:</span>
                        <Badge 
                          variant={customRulesMatchPercent >= 80 ? "default" : "outline"}
                          className={
                            customRulesMatchPercent >= 80 ? 'bg-green-600 dark:bg-green-900' : 
                            customRulesMatchPercent >= 60 ? 'bg-amber-500 text-amber-950 dark:bg-amber-900 dark:text-amber-100' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }
                        >
                          {customRulesMatchPercent}%
                        </Badge>
                      </div>
                      
                      <div className="w-full sm:w-44 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            customRulesMatchPercent >= 80 ? 'bg-green-500' : 
                            customRulesMatchPercent >= 60 ? 'bg-amber-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${customRulesMatchPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                      customRulesMatchPercent >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                      customRulesMatchPercent >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                      {customRulesMatchPercent >= 80 ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Excellent trade setup</span>
                        </>
                      ) : customRulesMatchPercent >= 60 ? (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Moderate trade setup</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Poor trade setup</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bullish" className="space-y-4">
            <Card className="bg-card">
              <CardHeader className="relative pb-2">
                <div className="absolute -left-0 top-0 bottom-0 w-1 rounded-tl-md rounded-bl-md bg-green-500"></div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Bullish Trade Setup Requirements
                </CardTitle>
                <CardDescription>
                  These criteria must be met for a stock to qualify as a bullish trade setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RuleCheckItem 
                    title="Strong Bullish Trend" 
                    description="EMAs aligned with 10 EMA > 20 EMA > 50 EMA"
                    passed={bullishRulesStatus.emaAlignment}
                    value={stockData.emaTrend}
                    setupType="bullish"
                  />
                  
                  <RuleCheckItem 
                    title="Bullish Sentiment" 
                    description={`PCR below threshold (< ${stockData.iv > 50 ? '0.5' : stockData.iv > 30 ? '0.8' : '0.7'} in ${stockData.iv > 50 ? 'high' : stockData.iv > 30 ? 'moderate' : 'low'} IV)`}
                    passed={bullishRulesStatus.pcrThreshold}
                    value={stockData.pcr.toFixed(2)}
                    setupType="bullish"
                  />
                  
                  <RuleCheckItem 
                    title="Strong Momentum" 
                    description="RSI between 55-80, Stochastic RSI > 60"
                    passed={bullishRulesStatus.rsiRange && bullishRulesStatus.stochRsiThreshold}
                    value={`RSI: ${stockData.rsi.toFixed(1)}, Stoch RSI: ${stockData.stochasticRsi.toFixed(1)}`}
                    setupType="bullish"
                  />
                  
                  <RuleCheckItem 
                    title="Price Near Support" 
                    description="Price near support level with high call OI/gamma above"
                    passed={bullishRulesStatus.priceNearSupport}
                    value={`Support: $${stockData.keyLevels.support[0].toFixed(2)}, $${stockData.keyLevels.support[1].toFixed(2)}`}
                    setupType="bullish"
                  />
                  
                  <RuleCheckItem 
                    title="Positive GEX" 
                    description="Gamma Exposure > $500M (bullish stability)"
                    passed={bullishRulesStatus.positiveGEX}
                    value={`GEX: ${formatGEX(stockData.gex)}`}
                    setupType="bullish"
                  />
                  
                  <RuleCheckItem 
                    title="High Vanna/Vomma" 
                    description="High vanna/vomma values indicating IV sensitivity"
                    passed={bullishRulesStatus.highVanna}
                    value="Vanna/Vomma data available in Greeks tab"
                    setupType="bullish"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Bullish Criteria Match:</span>
                      <Badge 
                        variant={bullishMatchPercent >= 80 ? "default" : "outline"}
                        className={bullishMatchPercent >= 80 ? 'bg-green-600 dark:bg-green-900' : 'text-muted-foreground'}
                      >
                        {bullishMatchPercent}%
                      </Badge>
                    </div>
                    
                    <div className="w-44 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${bullishMatchPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddToWatchlist}
                    disabled={bullishMatchPercent < 60 || addingToWatchlist}
                    className="gap-2"
                  >
                    {addingToWatchlist ? (
                      <>
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        {bullishMatchPercent >= 60 ? 'Add to Bullish Watchlist' : 'Low Match Score'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bearish" className="space-y-4">
            <Card className="bg-card">
              <CardHeader className="relative pb-2">
                <div className="absolute -left-0 top-0 bottom-0 w-1 rounded-tl-md rounded-bl-md bg-red-500"></div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Bearish Trade Setup Requirements
                </CardTitle>
                <CardDescription>
                  These criteria must be met for a stock to qualify as a bearish trade setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RuleCheckItem 
                    title="Strong Bearish Trend" 
                    description="EMAs aligned with 10 EMA < 20 EMA < 50 EMA"
                    passed={bearishRulesStatus.emaAlignment}
                    value={stockData.emaTrend}
                    setupType="bearish"
                  />
                  
                  <RuleCheckItem 
                    title="Bearish Sentiment" 
                    description={`PCR above threshold (> ${stockData.iv > 50 ? '1.5' : stockData.iv > 30 ? '1.2' : '1.3'} in ${stockData.iv > 50 ? 'high' : stockData.iv > 30 ? 'moderate' : 'low'} IV)`}
                    passed={bearishRulesStatus.pcrThreshold}
                    value={stockData.pcr.toFixed(2)}
                    setupType="bearish"
                  />
                  
                  <RuleCheckItem 
                    title="Weak Momentum" 
                    description="RSI between 20-45, Stochastic RSI < 40"
                    passed={bearishRulesStatus.rsiRange && bearishRulesStatus.stochRsiThreshold}
                    value={`RSI: ${stockData.rsi.toFixed(1)}, Stoch RSI: ${stockData.stochasticRsi.toFixed(1)}`}
                    setupType="bearish"
                  />
                  
                  <RuleCheckItem 
                    title="Price Near Resistance" 
                    description="Price near resistance with high put OI/gamma below"
                    passed={bearishRulesStatus.priceNearResistance}
                    value={`Resistance: $${stockData.keyLevels.resistance[0].toFixed(2)}, $${stockData.keyLevels.resistance[1].toFixed(2)}`}
                    setupType="bearish"
                  />
                  
                  <RuleCheckItem 
                    title="Negative GEX" 
                    description="Gamma Exposure < -$500M (bearish pressure)"
                    passed={bearishRulesStatus.negativeGEX}
                    value={`GEX: ${formatGEX(stockData.gex)}`}
                    setupType="bearish"
                  />
                  
                  <RuleCheckItem 
                    title="High Vanna/Vomma" 
                    description="High vanna/vomma values indicating IV sensitivity"
                    passed={bearishRulesStatus.highVanna}
                    value="Vanna/Vomma data available in Greeks tab"
                    setupType="bearish"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Bearish Criteria Match:</span>
                      <Badge 
                        variant={bearishMatchPercent >= 80 ? "default" : "outline"}
                        className={bearishMatchPercent >= 80 ? 'bg-red-600 dark:bg-red-900' : 'text-muted-foreground'}
                      >
                        {bearishMatchPercent}%
                      </Badge>
                    </div>
                    
                    <div className="w-44 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-2 bg-red-500 rounded-full" 
                        style={{ width: `${bearishMatchPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddToWatchlist}
                    disabled={bearishMatchPercent < 60 || addingToWatchlist}
                    className="gap-2"
                  >
                    {addingToWatchlist ? (
                      <>
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        {bearishMatchPercent >= 60 ? 'Add to Bearish Watchlist' : 'Low Match Score'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="neutral" className="space-y-4">
            <Card className="bg-card">
              <CardHeader className="relative pb-2">
                <div className="absolute -left-0 top-0 bottom-0 w-1 rounded-tl-md rounded-bl-md bg-blue-500"></div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Minus className="h-5 w-5 text-blue-500" />
                  Neutral Trade Setup Requirements
                </CardTitle>
                <CardDescription>
                  These criteria must be met for a stock to qualify as a neutral trade setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RuleCheckItem 
                    title="Neutral Trend" 
                    description="Flat EMAs or mixed signals (no clear alignment)"
                    passed={neutralRulesStatus.flatEMAs}
                    value={stockData.emaTrend}
                    setupType="neutral"
                  />
                  
                  <RuleCheckItem 
                    title="Balanced Options Activity" 
                    description="PCR between 0.8-1.2, indicating balanced call/put trading"
                    passed={neutralRulesStatus.pcrThreshold}
                    value={stockData.pcr.toFixed(2)}
                    setupType="neutral"
                  />
                  
                  <RuleCheckItem 
                    title="Low Implied Volatility" 
                    description="IV < 40%, suggesting a rangebound expectation"
                    passed={neutralRulesStatus.lowIV}
                    value={`${stockData.iv.toFixed(1)}%`}
                    setupType="neutral"
                  />
                  
                  <RuleCheckItem 
                    title="Neutral Momentum" 
                    description="RSI between 45-65, Stochastic RSI between 25-75"
                    passed={neutralRulesStatus.rsiRange && neutralRulesStatus.stochRsiRange}
                    value={`RSI: ${stockData.rsi.toFixed(1)}, Stoch RSI: ${stockData.stochasticRsi.toFixed(1)}`}
                    setupType="neutral"
                  />
                  
                  <RuleCheckItem 
                    title="Price Near Max Pain" 
                    description="Price close to Max Pain (within 2%)"
                    passed={neutralRulesStatus.priceNearMaxPain}
                    value={`Max Pain: $${stockData.keyLevels.maxPain.toFixed(2)}`}
                    setupType="neutral"
                  />
                  
                  <RuleCheckItem 
                    title="Low GEX" 
                    description="Gamma Exposure near zero (< ±$200M)"
                    passed={neutralRulesStatus.lowGEX}
                    value={`GEX: ${formatGEX(stockData.gex)}`}
                    setupType="neutral"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Neutral Criteria Match:</span>
                      <Badge 
                        variant={neutralMatchPercent >= 80 ? "default" : "outline"}
                        className={neutralMatchPercent >= 80 ? 'bg-blue-600 dark:bg-blue-900' : 'text-muted-foreground'}
                      >
                        {neutralMatchPercent}%
                      </Badge>
                    </div>
                    
                    <div className="w-44 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${neutralMatchPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddToWatchlist}
                    disabled={neutralMatchPercent < 60 || addingToWatchlist}
                    className="gap-2"
                  >
                    {addingToWatchlist ? (
                      <>
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5" />
                        {neutralMatchPercent >= 60 ? 'Add to Neutral Watchlist' : 'Low Match Score'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-between items-center text-sm text-muted-foreground">
        <div>Updated: {new Date().toLocaleString()}</div>
        <div className="flex items-center gap-2">
          <span>Trade Data Source:</span>
          <span className="font-medium">Options-Technical Hybrid Model</span>
        </div>
      </CardFooter>
    </Card>
  );
}

// Rule Check Item component for displaying individual rule status
function RuleCheckItem({ title, description, passed, value, setupType = 'bullish' }: { 
  title: string; 
  description: string; 
  passed: boolean; 
  value: string;
  setupType?: 'bullish' | 'bearish' | 'neutral';
}) {
  const setupColor = setupType === 'bullish' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' 
    : setupType === 'bearish'
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50';
    
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border ${setupColor}`}>
      <div className="flex items-start gap-3">
        {passed ? 
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500 mt-0.5" /> : 
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-500 mt-0.5" />
        }
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-2 sm:mt-0 pl-8 sm:pl-0 sm:text-right">
        <Badge variant={passed ? "default" : "outline"} className={
          passed 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'text-red-800 border-red-800 dark:text-red-400 dark:border-red-400'
        }>
          {value}
        </Badge>
      </div>
    </div>
  );
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

// Helper function to calculate match percentage for a rules object
function calculateMatchPercent(rulesStatus: Record<string, boolean>): number {
  const rules = Object.values(rulesStatus);
  if (rules.length === 0) return 0;
  
  const passedRules = rules.filter(rule => rule === true).length;
  return Math.round((passedRules / rules.length) * 100);
}

// Helper function to evaluate custom rules based on selected setup type
function evaluateCustomRules(stockData: any, customRules: any): Record<string, boolean> {
  // Default to bullish evaluation unless stock data suggests otherwise
  const setupType = stockData.setupType;
  
  const evaluation: Record<string, boolean> = {};
  
  // EMA Alignment
  if (customRules.emaAlignment) {
    if (setupType === 'bullish') {
      evaluation.emaAlignment = stockData.emaTrend === '10 > 20 > 50';
    } else if (setupType === 'bearish') {
      evaluation.emaAlignment = stockData.emaTrend === '10 < 20 < 50';
    } else {
      evaluation.emaAlignment = stockData.emaTrend.includes('>') && stockData.emaTrend.includes('<');
    }
  } else {
    evaluation.emaAlignment = true; // Rule disabled, so pass it
  }
  
  // PCR Threshold
  if (customRules.pcrThreshold) {
    if (setupType === 'bullish') {
      evaluation.pcrThreshold = stockData.pcr < (stockData.iv > 50 ? 0.5 : stockData.iv > 30 ? 0.8 : 0.7);
    } else if (setupType === 'bearish') {
      evaluation.pcrThreshold = stockData.pcr > (stockData.iv > 50 ? 1.5 : stockData.iv > 30 ? 1.2 : 1.3);
    } else {
      evaluation.pcrThreshold = stockData.pcr >= 0.8 && stockData.pcr <= 1.2;
    }
  } else {
    evaluation.pcrThreshold = true; // Rule disabled, so pass it
  }
  
  // RSI Range
  if (customRules.rsiRange) {
    if (setupType === 'bullish') {
      evaluation.rsiRange = stockData.rsi >= 55 && stockData.rsi <= 80;
    } else if (setupType === 'bearish') {
      evaluation.rsiRange = stockData.rsi >= 20 && stockData.rsi <= 45;
    } else {
      evaluation.rsiRange = stockData.rsi >= 45 && stockData.rsi <= 65;
    }
  } else {
    evaluation.rsiRange = true; // Rule disabled, so pass it
  }
  
  // Price Near Level
  if (customRules.priceNearSupport) {
    if (setupType === 'bullish') {
      evaluation.priceNearLevel = isPriceNearLevel(stockData.price, stockData.keyLevels.support, 'support');
    } else if (setupType === 'bearish') {
      evaluation.priceNearLevel = isPriceNearLevel(stockData.price, stockData.keyLevels.resistance, 'resistance');
    } else {
      evaluation.priceNearLevel = Math.abs(stockData.price - stockData.keyLevels.maxPain) < (stockData.price * 0.02);
    }
  } else {
    evaluation.priceNearLevel = true; // Rule disabled, so pass it
  }
  
  // GEX Alignment
  if (customRules.positiveGEX) {
    if (setupType === 'bullish') {
      evaluation.gexAlignment = stockData.gex > 500000;
    } else if (setupType === 'bearish') {
      evaluation.gexAlignment = stockData.gex < -500000;
    } else {
      evaluation.gexAlignment = Math.abs(stockData.gex) < 200000;
    }
  } else {
    evaluation.gexAlignment = true; // Rule disabled, so pass it
  }
  
  // High Vanna/Vomma (placeholder - would need actual data)
  if (customRules.highVanna) {
    evaluation.highVanna = true; // Placeholder
  } else {
    evaluation.highVanna = true; // Rule disabled, so pass it
  }
  
  return evaluation;
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