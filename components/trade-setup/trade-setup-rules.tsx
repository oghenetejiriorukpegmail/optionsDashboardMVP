"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
  Loader2
} from "lucide-react";
import { addToWatchlist, fetchScannerResults } from "@/lib/api";
import { toast } from "../ui/sonner";
import { cn } from "@/lib/utils";
import { TickerSelector } from "../ui/ticker-selector";

interface TradeSetupRulesProps {
  symbol?: string;
  ticker?: string; // Alternative prop name
  stockData?: {
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

export function TradeSetupRules({ symbol: propSymbol, ticker: propTicker, stockData: propStockData }: TradeSetupRulesProps) {
  const [selectedTicker, setSelectedTicker] = useState(propSymbol || propTicker || '');
  const symbol = selectedTicker || propSymbol || propTicker || 'AAPL';
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(propStockData || null);
  const [customRules, setCustomRules] = useState({
    emaAlignment: true,
    pcrThreshold: true,
    rsiRange: true,
    priceNearSupport: true,
    positiveGEX: true,
    highVanna: true
  });
  
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>('standard');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  // Fetch data when ticker changes
  useEffect(() => {
    if (selectedTicker) {
      fetchTickerData();
    }
  }, [selectedTicker]);

  const fetchTickerData = async () => {
    setLoading(true);
    try {
      const data = await fetchScannerResults({ symbol });
      if (data.setup) {
        // Transform scanner data to match expected format
        setStockData({
          price: data.setup.price || 0,
          setupType: data.setup.setupType || 'neutral',
          emaTrend: data.setup.emaTrend || 'Unknown',
          pcr: data.setup.pcr || 1.0,
          rsi: data.setup.rsi || 50,
          stochasticRsi: data.setup.stochRsi || 50,
          iv: data.setup.iv || 30,
          gex: 0, // Not available in scanner data
          keyLevels: {
            support: [data.setup.stopLoss || 0],
            resistance: [data.setup.targetPrice || 0],
            maxPain: data.setup.entryPrice || 0
          },
          recommendation: {
            action: data.setup.setupType === 'bullish' ? 'Buy Call' : data.setup.setupType === 'bearish' ? 'Buy Put' : 'Hold',
            target: data.setup.targetPrice || 'N/A',
            stop: data.setup.stopLoss || 'N/A',
            expiration: '30 DTE',
            strike: data.setup.entryPrice || 0
          }
        });
        
        // Update custom rules based on setup type
        setCustomRules(prev => ({
          ...prev,
          positiveGEX: data.setup.setupType === 'bullish'
        }));
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      toast('Failed to fetch ticker data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stockData) {
    // Use default mock data if no data is available
    const defaultData = {
      price: 100,
      setupType: 'neutral',
      emaTrend: 'Unknown',
      pcr: 1.0,
      rsi: 50,
      stochasticRsi: 50,
      iv: 30,
      gex: 0,
      keyLevels: {
        support: [95, 90],
        resistance: [105, 110],
        maxPain: 100
      },
      recommendation: {
        action: 'Hold',
        target: 'N/A',
        stop: 'N/A',
        expiration: '30 DTE',
        strike: 100
      }
    };
    setStockData(defaultData);
    return null; // Will re-render with default data
  }
  
  // Evaluate the current stock against rules for each setup type
  const bullishRulesStatus = {
    emaAlignment: stockData.emaTrend === 'Bullish (10 > 20 > 50)' || stockData.emaTrend === '10 > 20 > 50',
    pcrThreshold: stockData.pcr < (stockData.iv > 50 ? 0.5 : stockData.iv > 30 ? 0.8 : 0.7),
    rsiRange: stockData.rsi >= 55 && stockData.rsi <= 80,
    stochRsiThreshold: stockData.stochasticRsi > 60,
    priceNearSupport: isPriceNearLevel(stockData.price, stockData.keyLevels.support, 'support'),
    positiveGEX: stockData.gex > 500000,
    highVanna: true // Placeholder (would be based on actual vanna values)
  };
  
  const bearishRulesStatus = {
    emaAlignment: stockData.emaTrend === 'Bearish (10 < 20 < 50)' || stockData.emaTrend === '10 < 20 < 50',
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
  
  // Helper function to check if price is near support/resistance
  function isPriceNearLevel(price: number, levels: number[], type: 'support' | 'resistance'): boolean {
    if (!levels || levels.length === 0) return false;
    const threshold = price * 0.01; // 1% threshold
    
    return levels.some(level => {
      if (type === 'support') {
        return price >= level && price <= level + threshold;
      } else {
        return price <= level && price >= level - threshold;
      }
    });
  }
  
  // Calculate setup strength
  const calculateSetupStrength = (rulesStatus: Record<string, boolean>) => {
    const totalRules = Object.keys(rulesStatus).length;
    const passedRules = Object.values(rulesStatus).filter(status => status).length;
    return Math.round((passedRules / totalRules) * 100);
  };
  
  const bullishStrength = calculateSetupStrength(bullishRulesStatus);
  const bearishStrength = calculateSetupStrength(bearishRulesStatus);
  const neutralStrength = calculateSetupStrength(neutralRulesStatus);
  
  // Determine recommended setup type
  const getRecommendedSetup = () => {
    const strengths = {
      bullish: bullishStrength,
      bearish: bearishStrength,
      neutral: neutralStrength
    };
    
    const maxStrength = Math.max(...Object.values(strengths));
    const recommendedType = Object.entries(strengths).find(([_, strength]) => strength === maxStrength)?.[0];
    
    return {
      type: recommendedType,
      strength: maxStrength
    };
  };
  
  const recommendedSetup = getRecommendedSetup();
  
  // Handle adding to watchlist
  const handleAddToWatchlist = async () => {
    setAddingToWatchlist(true);
    try {
      await addToWatchlist({
        symbol,
        price: stockData.price,
        setupType: recommendedSetup.type || 'neutral',
        entryTarget: stockData.price,
        stopLoss: stockData.recommendation.stop || 'N/A'
      });
      toast('Added to watchlist', {
        description: `${symbol} has been added to your watchlist`,
      });
    } catch (error) {
      toast('Error', {
        description: 'Failed to add to watchlist',
      });
    } finally {
      setAddingToWatchlist(false);
    }
  };
  
  const RuleCheckItem = ({ rule, status, description }: { rule: string; status: boolean; description?: string }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <div className="mt-0.5">
        {status ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{rule}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
    </div>
  );
  
  const SetupCard = ({
    type,
    rulesStatus,
    strength,
    isRecommended
  }: {
    type: 'bullish' | 'bearish' | 'neutral';
    rulesStatus: Record<string, boolean>;
    strength: number;
    isRecommended: boolean;
  }) => {
    const setupConfig = {
      bullish: {
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        title: 'Bullish Setup',
        description: 'Conditions for call option entry'
      },
      bearish: {
        icon: TrendingDown,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        title: 'Bearish Setup',
        description: 'Conditions for put option entry'
      },
      neutral: {
        icon: Minus,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        title: 'Neutral Setup',
        description: 'Conditions for range-bound strategies'
      }
    };
    
    const config = setupConfig[type];
    const Icon = config.icon;
    
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200",
        isRecommended && "ring-2 ring-blue-500 shadow-lg"
      )}>
        {isRecommended && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white">Recommended</Badge>
          </div>
        )}
        
        <CardHeader className={cn(config.bgColor, "border-b", config.borderColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-white dark:bg-gray-900", config.borderColor, "border")}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <div>
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <CardDescription className="text-xs">{config.description}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{strength}%</div>
              <div className="text-xs text-muted-foreground">Strength</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-2">
          {type === 'bullish' && (
            <>
              <RuleCheckItem
                rule="EMA Alignment (10 > 20 > 50)"
                status={rulesStatus.emaAlignment}
                description={`Current: ${stockData.emaTrend}`}
              />
              <RuleCheckItem
                rule={`Put/Call Ratio < ${stockData.iv > 50 ? '0.5' : stockData.iv > 30 ? '0.8' : '0.7'}`}
                status={rulesStatus.pcrThreshold}
                description={`Current PCR: ${stockData.pcr.toFixed(2)}`}
              />
              <RuleCheckItem
                rule="RSI between 55-80"
                status={rulesStatus.rsiRange}
                description={`Current RSI: ${stockData.rsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Stochastic RSI > 60"
                status={rulesStatus.stochRsiThreshold}
                description={`Current Stoch RSI: ${stockData.stochasticRsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Price near support"
                status={rulesStatus.priceNearSupport}
                description={`Support levels: ${stockData.keyLevels.support.map(s => `$${s}`).join(', ')}`}
              />
              <RuleCheckItem
                rule="Positive GEX (> 500K)"
                status={rulesStatus.positiveGEX}
                description={`Current GEX: ${stockData.gex.toLocaleString()}`}
              />
            </>
          )}
          
          {type === 'bearish' && (
            <>
              <RuleCheckItem
                rule="EMA Alignment (10 < 20 < 50)"
                status={rulesStatus.emaAlignment}
                description={`Current: ${stockData.emaTrend}`}
              />
              <RuleCheckItem
                rule={`Put/Call Ratio > ${stockData.iv > 50 ? '1.5' : stockData.iv > 30 ? '1.2' : '1.3'}`}
                status={rulesStatus.pcrThreshold}
                description={`Current PCR: ${stockData.pcr.toFixed(2)}`}
              />
              <RuleCheckItem
                rule="RSI between 20-45"
                status={rulesStatus.rsiRange}
                description={`Current RSI: ${stockData.rsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Stochastic RSI < 40"
                status={rulesStatus.stochRsiThreshold}
                description={`Current Stoch RSI: ${stockData.stochasticRsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Price near resistance"
                status={rulesStatus.priceNearResistance}
                description={`Resistance levels: ${stockData.keyLevels.resistance.map(r => `$${r}`).join(', ')}`}
              />
              <RuleCheckItem
                rule="Negative GEX (< -500K)"
                status={rulesStatus.negativeGEX}
                description={`Current GEX: ${stockData.gex.toLocaleString()}`}
              />
            </>
          )}
          
          {type === 'neutral' && (
            <>
              <RuleCheckItem
                rule="Mixed EMA alignment"
                status={rulesStatus.flatEMAs}
                description={`Current: ${stockData.emaTrend}`}
              />
              <RuleCheckItem
                rule="Put/Call Ratio 0.8-1.2"
                status={rulesStatus.pcrThreshold}
                description={`Current PCR: ${stockData.pcr.toFixed(2)}`}
              />
              <RuleCheckItem
                rule="Low IV (< 40%)"
                status={rulesStatus.lowIV}
                description={`Current IV: ${stockData.iv.toFixed(0)}%`}
              />
              <RuleCheckItem
                rule="RSI between 45-65"
                status={rulesStatus.rsiRange}
                description={`Current RSI: ${stockData.rsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Stochastic RSI 25-75"
                status={rulesStatus.stochRsiRange}
                description={`Current Stoch RSI: ${stockData.stochasticRsi.toFixed(0)}`}
              />
              <RuleCheckItem
                rule="Price near max pain"
                status={rulesStatus.priceNearMaxPain}
                description={`Max pain: $${stockData.keyLevels.maxPain}`}
              />
              <RuleCheckItem
                rule="Low GEX (|GEX| < 200K)"
                status={rulesStatus.lowGEX}
                description={`Current GEX: ${Math.abs(stockData.gex).toLocaleString()}`}
              />
            </>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <TickerSelector 
            value={selectedTicker}
            onValueChange={setSelectedTicker}
            placeholder="Select ticker..."
          />
          <p className="text-muted-foreground">Select a ticker to view trade setup analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <TickerSelector 
            value={selectedTicker}
            onValueChange={setSelectedTicker}
            placeholder="Select ticker..."
          />
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              {symbol}
              <Badge variant="outline" className="text-lg">
                ${stockData?.price?.toFixed(2) || 'N/A'}
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-1">
              Trade setup analysis based on technical and options indicators
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'standard' ? 'advanced' : 'standard')}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {viewMode === 'standard' ? 'Advanced' : 'Standard'} View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToWatchlist}
            disabled={addingToWatchlist}
            className="gap-2"
          >
            {addingToWatchlist ? (
              <Activity className="h-4 w-4 animate-pulse" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            Add to Watchlist
          </Button>
        </div>
      </div>
      
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Current Market Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Setup Type</div>
              <div className="font-semibold capitalize flex items-center gap-1">
                {stockData.setupType === 'bullish' && <TrendingUp className="h-4 w-4 text-green-500" />}
                {stockData.setupType === 'bearish' && <TrendingDown className="h-4 w-4 text-red-500" />}
                {stockData.setupType === 'neutral' && <Minus className="h-4 w-4 text-yellow-500" />}
                {stockData.setupType}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">EMA Trend</div>
              <div className="font-semibold">{stockData.emaTrend}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Put/Call Ratio</div>
              <div className="font-semibold">{stockData.pcr.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">RSI</div>
              <div className="font-semibold">{stockData.rsi.toFixed(0)}</div>
            </div>
          </div>
          
          {/* Recommendation */}
          <Separator className="my-4" />
          
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Recommendation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Action: </span>
                <span className="font-medium">{stockData.recommendation.action}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target: </span>
                <span className="font-medium">
                  {typeof stockData.recommendation.target === 'number' 
                    ? `$${stockData.recommendation.target.toFixed(2)}`
                    : stockData.recommendation.target}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Stop Loss: </span>
                <span className="font-medium">
                  {typeof stockData.recommendation.stop === 'number'
                    ? `$${stockData.recommendation.stop.toFixed(2)}`
                    : stockData.recommendation.stop}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Expiration: </span>
                <span className="font-medium">{stockData.recommendation.expiration}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Setup Analysis */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Setups</TabsTrigger>
          <TabsTrigger value="bullish" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Bullish
          </TabsTrigger>
          <TabsTrigger value="bearish" className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            Bearish
          </TabsTrigger>
          <TabsTrigger value="neutral" className="flex items-center gap-1">
            <Minus className="h-4 w-4" />
            Neutral
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SetupCard
              type="bullish"
              rulesStatus={bullishRulesStatus}
              strength={bullishStrength}
              isRecommended={recommendedSetup.type === 'bullish'}
            />
            <SetupCard
              type="bearish"
              rulesStatus={bearishRulesStatus}
              strength={bearishStrength}
              isRecommended={recommendedSetup.type === 'bearish'}
            />
            <SetupCard
              type="neutral"
              rulesStatus={neutralRulesStatus}
              strength={neutralStrength}
              isRecommended={recommendedSetup.type === 'neutral'}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="bullish" className="mt-6">
          <SetupCard
            type="bullish"
            rulesStatus={bullishRulesStatus}
            strength={bullishStrength}
            isRecommended={recommendedSetup.type === 'bullish'}
          />
        </TabsContent>
        
        <TabsContent value="bearish" className="mt-6">
          <SetupCard
            type="bearish"
            rulesStatus={bearishRulesStatus}
            strength={bearishStrength}
            isRecommended={recommendedSetup.type === 'bearish'}
          />
        </TabsContent>
        
        <TabsContent value="neutral" className="mt-6">
          <SetupCard
            type="neutral"
            rulesStatus={neutralRulesStatus}
            strength={neutralStrength}
            isRecommended={recommendedSetup.type === 'neutral'}
          />
        </TabsContent>
      </Tabs>
      
      {/* Advanced View - Custom Rules */}
      {viewMode === 'advanced' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Rule Configuration
            </CardTitle>
            <CardDescription>
              Toggle rules on/off to customize your trading strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(customRules).map(([rule, enabled]) => (
              <div key={rule} className="flex items-center justify-between">
                <Label htmlFor={rule} className="text-sm font-medium capitalize">
                  {rule.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={rule}
                  checked={enabled}
                  onCheckedChange={(checked) => 
                    setCustomRules(prev => ({ ...prev, [rule]: checked }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}