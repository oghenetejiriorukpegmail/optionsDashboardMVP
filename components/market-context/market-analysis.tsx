"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { fetchScannerResults } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Line, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  BarChart4, 
  RefreshCw, 
  PieChart, 
  Zap,
  Loader2,
  Share2,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle
} from "lucide-react";
import { Badge } from "../ui/badge";
import { CandlestickChart } from "../charts/CandlestickChart";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MarketContextProps {
  symbol?: string;
  ticker?: string; // Alternative prop name
}

// Create a simple wrapper component
export function MarketAnalysis({ ticker }: { ticker?: string }) {
  const symbol = ticker || 'AAPL';
  return <MarketContextAnalysis symbol={symbol} ticker={ticker} />;
}

export function MarketContextAnalysis({ symbol: propSymbol, ticker }: MarketContextProps) {
  const symbol = propSymbol || ticker || 'AAPL';
  const [indicators, setIndicators] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('3M'); // Default to 3 months

  async function loadIndicators() {
    setLoading(true);
    try {
      // Use new ticker-context API instead of legacy technical-indicators
      const response = await fetch(`/api/ticker-context?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticker context: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setIndicators(data);
    } catch (error) {
      // On error, preserve existing data but add error flag (don't replace everything)
      setIndicators((prev: any) => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch ticker context' 
      }));
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // Force refresh by triggering data collection first, then fetch context
      await fetch(`/api/scanner?symbol=${symbol}&refresh=true`);
      
      // Now get the updated context
      const response = await fetch(`/api/ticker-context?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticker context: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setIndicators(data);
    } catch (error) {
      // On refresh error, preserve existing data but add error flag (don't replace everything)
      setIndicators((prev: any) => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh ticker context' 
      }));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (symbol) {
      loadIndicators();
    }
  }, [symbol]);

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Analysis
          </CardTitle>
          <CardDescription>Analyzing market context data for {symbol}...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading technical indicators and options metrics</p>
        </CardContent>
      </Card>
    );
  }

  if (!indicators || !indicators.historicalData) {
    return (
      <Card className="w-full bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Analysis
          </CardTitle>
          <CardDescription>Options-Technical Hybrid analysis framework</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">No Data Available</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Unable to retrieve market context data for {symbol}. Please try refreshing or select a different symbol.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-0">
          <Button variant="outline" className="gap-2" onClick={() => loadIndicators()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Prepare historical data for charts with improved date formatting
  const historicalData = indicators.historicalData || [];
  
  // Return early if no historical data
  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
            <CardDescription>No historical data available for {ticker}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading market data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const dates = historicalData.map((d: any, index: number) => {
    const date = new Date(d.date);
    // Show only every 7th date to avoid overcrowding, or if it's the last point
    if (index % 7 === 0 || index === historicalData.length - 1) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  });
  const fullDates = historicalData.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: '2-digit' 
  }));
  const closes = historicalData.map((d: any) => d?.close || null);
  const volumes = historicalData.map((d: any) => d?.volume || 0);
  const ema10 = historicalData.map((d: any) => d?.ema10 || null);
  const ema20 = historicalData.map((d: any) => d?.ema20 || null);
  const ema50 = historicalData.map((d: any) => d?.ema50 || null);
  const rsiValues = historicalData.map((d: any) => d?.rsi || 50);
  const stochRsiValues = historicalData.map((d: any) => d.stochasticRsi);
  
  // Get latest data point for trend analysis
  const latestData = historicalData[historicalData.length - 1];
  
  // Determine trend status
  const trendStatus = determineTrendStatus(latestData);
  
  // Determine sentiment from PCR
  const sentimentStatus = determineSentimentStatus(indicators.pcr, indicators.iv);
  
  // Determine momentum status from RSI and Stochastic RSI
  const momentumStatus = determineMomentumStatus(latestData.rsi, latestData.stochasticRsi);
  
  // Get number of data points to show based on selected period
  // Using actual calendar days since the data includes all days, not just trading days
  const getDaysForPeriod = (period: string): number => {
    switch (period) {
      case '1M': return 30; // 1 month 
      case '3M': return 90; // 3 months  
      case '6M': return 180; // 6 months
      case '1Y': return 365; // 1 year
      default: return 90; // Default to 3M
    }
  };
  
  const daysToShow = getDaysForPeriod(selectedPeriod);
  
  // Group by date to eliminate intraday noise, then filter by time period
  const sampledData = (() => {
    const dailyData: any[] = [];
    const dateGroups: {[key: string]: any[]} = {};
    
    // Group ALL historical data by date first
    historicalData.forEach((item: any) => {
      const dateStr = new Date(item.date).toDateString();
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(item);
    });
    
    // Take the last entry for each date (end-of-day close)
    Object.keys(dateGroups).forEach(dateStr => {
      const dayData = dateGroups[dateStr];
      // Sort by timestamp and take the last one (latest time of day)
      const sortedData = dayData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      dailyData.push(sortedData[sortedData.length - 1]);
    });
    
    // Sort by date and THEN filter by time period
    const sortedDailyData = dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedDailyData.slice(-Math.min(daysToShow, sortedDailyData.length));
  })();
  
  
  // Enhanced RSI and Stochastic RSI Chart configuration with better contrast
  const rsiChartData = {
    labels: dates,
    datasets: [
      {
        label: 'RSI (14)',
        data: rsiValues,
        borderColor: '#3b82f6', // Bright blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Stochastic RSI',
        data: stochRsiValues,
        borderColor: '#f97316', // Bright orange
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2.5,
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderDash: [8, 4], // More prominent dashed pattern
        yAxisID: 'y',
      },
    ],
  };
  
  const rsiChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: (context: any) => {
            if (context.tick.value === 30 || context.tick.value === 70) {
              return 'rgba(255, 99, 132, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          },
          lineWidth: (context: any) => {
            if (context.tick.value === 30 || context.tick.value === 70) {
              return 2;
            }
            return 1;
          },
        },
      },
      x: {
        display: true,
        grid: {
          display: false,
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'neutral':
        return <Minus className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getBadgeClasses = (type: string) => {
    switch (type) {
      case 'bullish':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'bearish':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
      <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
      
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Analysis
          </CardTitle>
          <CardDescription>
            Analysis for {symbol} using the Options-Technical Hybrid framework
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => loadIndicators()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getBadgeClasses(trendStatus.type)}`}>
            {getStatusIcon(trendStatus.type)}
            Trend: {trendStatus.label}
          </span>
          
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getBadgeClasses(sentimentStatus.type)}`}>
            <Share2 className="h-4 w-4" />
            Sentiment: {sentimentStatus.label}
          </span>
          
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getBadgeClasses(momentumStatus.type)}`}>
            <Zap className="h-4 w-4" />
            Momentum: {momentumStatus.label}
          </span>
          
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${indicators.iv > 50 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : indicators.iv < 20 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
            <PieChart className="h-4 w-4" />
            IV: {indicators.iv && isFinite(indicators.iv) ? `${indicators.iv.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trend
            </TabsTrigger>
            <TabsTrigger value="momentum" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Momentum
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Market Context Summary</CardTitle>
                <CardDescription>
                  Current price: <span className="font-semibold">{indicators.price && isFinite(indicators.price) ? `$${indicators.price.toFixed(2)}` : 'N/A'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trend Status */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusIcon(trendStatus.type)}
                      <h3 className="font-semibold">Trend Status</h3>
                    </div>
                    <div className={`font-medium mb-1 ${
                      trendStatus.type === 'bullish' ? 'text-green-600 dark:text-green-400' : 
                      trendStatus.type === 'bearish' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {trendStatus.label}
                    </div>
                    <p className="text-sm text-muted-foreground">{trendStatus.description}</p>
                  </div>
                  
                  {/* Sentiment Status */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Share2 className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Options Sentiment</h3>
                    </div>
                    <div className={`font-medium mb-1 ${
                      sentimentStatus.type === 'bullish' ? 'text-green-600 dark:text-green-400' : 
                      sentimentStatus.type === 'bearish' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {sentimentStatus.label}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Put-Call Ratio:</span>
                        <span className="font-mono">{indicators.pcr && isFinite(indicators.pcr) ? indicators.pcr.toFixed(2) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Implied Volatility:</span>
                        <span className="font-mono">{indicators.iv && isFinite(indicators.iv) ? `${indicators.iv.toFixed(1)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Momentum Status */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Momentum Status</h3>
                    </div>
                    <div className={`font-medium mb-1 ${
                      momentumStatus.type === 'bullish' ? 'text-green-600 dark:text-green-400' : 
                      momentumStatus.type === 'bearish' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {momentumStatus.label}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RSI (14):</span>
                        <span className={`font-mono ${
                          latestData.rsi > 70 ? 'text-red-600 dark:text-red-400' : 
                          latestData.rsi < 30 ? 'text-green-600 dark:text-green-400' : ''
                        }`}>{latestData.rsi && isFinite(latestData.rsi) ? latestData.rsi.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stochastic RSI:</span>
                        <span className={`font-mono ${
                          latestData.stochasticRsi > 80 ? 'text-red-600 dark:text-red-400' : 
                          latestData.stochasticRsi < 20 ? 'text-green-600 dark:text-green-400' : ''
                        }`}>{latestData.stochasticRsi && isFinite(latestData.stochasticRsi) ? latestData.stochasticRsi.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Technical Data Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    Technical Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">Current Price:</div>
                      <div className="text-sm font-mono text-right">{indicators.price && isFinite(indicators.price) ? `$${indicators.price.toFixed(2)}` : 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">EMA (10):</div>
                      <div className="text-sm font-mono text-right">{latestData.ema10 && isFinite(latestData.ema10) ? `$${latestData.ema10.toFixed(2)}` : 'N/A'}</div>
                      
                      <div className="text-sm font-medium">EMA (20):</div>
                      <div className="text-sm font-mono text-right">{latestData.ema20 && isFinite(latestData.ema20) ? `$${latestData.ema20.toFixed(2)}` : 'N/A'}</div>
                      
                      <div className="text-sm font-medium">EMA (50):</div>
                      <div className="text-sm font-mono text-right">{latestData.ema50 && isFinite(latestData.ema50) ? `$${latestData.ema50.toFixed(2)}` : 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">Volume (Current):</div>
                      <div className="text-sm font-mono text-right">{formatLargeNumber(indicators.volume.current)}</div>
                      
                      <div className="text-sm font-medium">Volume Change:</div>
                      <div className={`text-sm font-mono text-right ${
                        indicators.volume.percentChange > 20 ? 'text-green-600 dark:text-green-400' : 
                        indicators.volume.percentChange < -20 ? 'text-red-600 dark:text-red-400' : ''
                      }`}>{indicators.volume.percentChange && isFinite(indicators.volume.percentChange) ? `${indicators.volume.percentChange.toFixed(1)}%` : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Options Data Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Options Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">Put-Call Ratio:</div>
                      <div className={`text-sm font-mono text-right ${
                        indicators.pcr < 0.7 ? 'text-green-600 dark:text-green-400' : 
                        indicators.pcr > 1.3 ? 'text-red-600 dark:text-red-400' : ''
                      }`}>{indicators.pcr && isFinite(indicators.pcr) ? indicators.pcr.toFixed(2) : 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">Implied Volatility:</div>
                      <div className={`text-sm font-mono text-right ${
                        indicators.iv > 50 ? 'text-red-600 dark:text-red-400' : 
                        indicators.iv < 20 ? 'text-green-600 dark:text-green-400' : ''
                      }`}>{indicators.iv && isFinite(indicators.iv) ? `${indicators.iv.toFixed(1)}%` : 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/30">
                      <div className="text-sm font-medium">Gamma Exposure:</div>
                      <div className={`text-sm font-mono text-right ${
                        indicators.gex > 500000000 ? 'text-green-600 dark:text-green-400' : 
                        indicators.gex < -500000000 ? 'text-red-600 dark:text-red-400' : ''
                      }`}>{indicators.gex && isFinite(indicators.gex) ? `${(indicators.gex / 1000000).toFixed(1)}M` : 'N/A'}</div>
                      
                      <div className="text-sm font-medium">Max Pain:</div>
                      <div className="text-sm font-mono text-right">{indicators.keyLevels?.maxPain && isFinite(indicators.keyLevels.maxPain) ? `$${indicators.keyLevels.maxPain.toFixed(2)}` : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trend" className="space-y-6">
            <Card className="border p-0 overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    Price and Moving Averages
                  </h3>
                  {/* Time Period Selector */}
                  <div className="flex gap-1">
                    <button 
                      className={`px-2 py-1 text-xs border rounded ${selectedPeriod === '1M' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={() => setSelectedPeriod('1M')}
                    >
                      1M
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs border rounded ${selectedPeriod === '3M' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={() => setSelectedPeriod('3M')}
                    >
                      3M
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs border rounded ${selectedPeriod === '6M' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={() => setSelectedPeriod('6M')}
                    >
                      6M
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs border rounded ${selectedPeriod === '1Y' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      onClick={() => setSelectedPeriod('1Y')}
                    >
                      1Y
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4" style={{ height: '480px' }}>
                <CandlestickChart 
                  data={sampledData}
                  symbol={symbol}
                  selectedPeriod={selectedPeriod}
                  height={450}
                />
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* EMA Alignment Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    EMA Alignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className={`p-3 rounded-md mb-2 ${
                    trendStatus.type === 'bullish' ? 'bg-green-100 dark:bg-green-900/30' : 
                    trendStatus.type === 'bearish' ? 'bg-red-100 dark:bg-red-900/30' : 
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(trendStatus.type)}
                      <span className="font-medium">
                        {trendStatus.type.charAt(0).toUpperCase() + trendStatus.type.slice(1)} Alignment
                      </span>
                    </div>
                    <p className="text-sm">
                      {trendStatus.emaDescription}
                    </p>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/20">
                      <span className="font-medium text-muted-foreground">10 EMA:</span>
                      <span>{latestData.ema10 && isFinite(latestData.ema10) ? `$${latestData.ema10.toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/20">
                      <span className="font-medium text-muted-foreground">20 EMA:</span>
                      <span>{latestData.ema20 && isFinite(latestData.ema20) ? `$${latestData.ema20.toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/20">
                      <span className="font-medium text-muted-foreground">50 EMA:</span>
                      <span>{latestData.ema50 && isFinite(latestData.ema50) ? `$${latestData.ema50.toFixed(2)}` : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Price vs EMAs Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Price vs EMAs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${indicators.price > latestData.ema10 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Price vs 10 EMA</span>
                      </div>
                      <span className={`font-medium ${
                        indicators.price > latestData.ema10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {indicators.price > latestData.ema10 ? 'Above' : 'Below'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${indicators.price > latestData.ema20 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Price vs 20 EMA</span>
                      </div>
                      <span className={`font-medium ${
                        indicators.price > latestData.ema20 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {indicators.price > latestData.ema20 ? 'Above' : 'Below'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${indicators.price > latestData.ema50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Price vs 50 EMA</span>
                      </div>
                      <span className={`font-medium ${
                        indicators.price > latestData.ema50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {indicators.price > latestData.ema50 ? 'Above' : 'Below'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Volume Analysis Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    Volume Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{formatLargeNumber(indicators.volume.current)}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        indicators.volume.percentChange > 20 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        indicators.volume.percentChange < -20 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {indicators.volume.percentChange && isFinite(indicators.volume.percentChange) ? `${indicators.volume.percentChange > 0 ? '+' : ''}${indicators.volume.percentChange.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="p-3 rounded-md bg-muted/20">
                      <p className="text-sm">
                        {indicators.volume.percentChange > 50 ? 'Very high volume spike, significant interest in the stock.' :
                         indicators.volume.percentChange > 20 ? 'Elevated volume indicating increased trading activity.' :
                         indicators.volume.percentChange < -50 ? 'Very low volume compared to average, indicating lack of interest.' :
                         indicators.volume.percentChange < -20 ? 'Below average volume indicating reduced trading activity.' :
                         'Normal trading volume without significant deviation from average.'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/20">
                      <span className="font-medium text-sm text-muted-foreground">Average Volume (10d):</span>
                      <span className="text-sm">{formatLargeNumber(indicators.volume?.average || indicators.volume?.current)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="momentum" className="space-y-6">
            <Card className="border p-0 overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  RSI & Stochastic RSI Chart
                </h3>
              </div>
              <div className="p-4 h-80">
                <Line data={rsiChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  elements: {
                    point: {
                      hoverRadius: 8,
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      position: 'right' as const,
                      ticks: {
                        stepSize: 20,
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        color: (context: any) => {
                          if (context.tick.value === 30 || context.tick.value === 70) {
                            return 'rgba(239, 68, 68, 0.3)'; // Red lines for oversold/overbought
                          } else if (context.tick.value === 50) {
                            return 'rgba(156, 163, 175, 0.2)'; // Gray line for midline
                          }
                          return 'rgba(156, 163, 175, 0.05)';
                        },
                        lineWidth: (context: any) => {
                          if (context.tick.value === 30 || context.tick.value === 70) {
                            return 2;
                          } else if (context.tick.value === 50) {
                            return 1;
                          }
                          return 0.5;
                        },
                      },
                    },
                    x: {
                      display: true,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        maxRotation: 0,
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                        callback: function(value: any, index: number) {
                          const label = this.getLabelForValue(value);
                          return label || '';
                        }
                      }
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      align: 'start' as const,
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'line',
                        padding: 20,
                        font: {
                          size: 12,
                          weight: 'normal' as const,
                        },
                        color: '#6b7280',
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      titleColor: '#f9fafb',
                      bodyColor: '#f9fafb',
                      borderColor: '#374151',
                      borderWidth: 1,
                      padding: 16,
                      cornerRadius: 8,
                      usePointStyle: true,
                      boxPadding: 8,
                      displayColors: true,
                      callbacks: {
                        title: (context: any) => {
                          const index = context[0].dataIndex;
                          return fullDates[index];
                        },
                        label: (context: any) => {
                          const value = context.parsed.y;
                          return `${context.dataset.label}: ${value ? value.toFixed(1) : 'N/A'}`;
                        }
                      }
                    }
                  },
                  animation: {
                    duration: 750,
                    easing: 'easeInOutQuart',
                  },
                }} />
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RSI Status Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    RSI Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`text-3xl font-bold ${
                      latestData.rsi > 70 ? 'text-red-600 dark:text-red-400' : 
                      latestData.rsi < 30 ? 'text-green-600 dark:text-green-400' : ''
                    }`}>
                      {latestData.rsi && isFinite(latestData.rsi) ? latestData.rsi.toFixed(1) : 'N/A'}
                    </div>
                    <div className={`px-2 py-0.5 text-xs rounded-full ${
                      latestData.rsi > 70 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                      latestData.rsi < 30 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      latestData.rsi > 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      latestData.rsi < 40 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {latestData.rsi > 70 ? 'Overbought' : 
                       latestData.rsi < 30 ? 'Oversold' :
                       latestData.rsi > 60 ? 'Strong' :
                       latestData.rsi < 40 ? 'Weak' :
                       'Neutral'}
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-md bg-muted/20 mb-3">
                    <p className="text-sm">
                      {latestData.rsi > 70 ? 'Overbought territory, potential reversal signal. Consider profit-taking or bearish setups.' : 
                       latestData.rsi < 30 ? 'Oversold territory, potential bounce ahead. Watch for bullish reversal signals.' :
                       latestData.rsi > 60 ? 'Strong bullish momentum with room to run before overbought. Favor bullish setups.' :
                       latestData.rsi < 40 ? 'Weak momentum indicating bearish pressure. Use caution with bullish setups.' :
                       'Neutral momentum without clear directional bias. Wait for confirmation or use range-bound strategies.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">RSI Direction:</div>
                    <div className={`text-sm font-medium ${
                      rsiTrend(historicalData) === 'up' ? 'text-green-600 dark:text-green-400' : 
                      rsiTrend(historicalData) === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {rsiTrend(historicalData) === 'up' ? 'Rising' : 
                       rsiTrend(historicalData) === 'down' ? 'Falling' : 
                       'Flat'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Stochastic RSI Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Stochastic RSI
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`text-3xl font-bold ${
                      latestData.stochasticRsi > 80 ? 'text-red-600 dark:text-red-400' : 
                      latestData.stochasticRsi < 20 ? 'text-green-600 dark:text-green-400' : ''
                    }`}>
                      {latestData.stochasticRsi && isFinite(latestData.stochasticRsi) ? latestData.stochasticRsi.toFixed(1) : 'N/A'}
                    </div>
                    <div className={`px-2 py-0.5 text-xs rounded-full ${
                      latestData.stochasticRsi > 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                      latestData.stochasticRsi < 20 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      latestData.stochasticRsi > 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      latestData.stochasticRsi < 40 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {latestData.stochasticRsi > 80 ? 'Extreme' : 
                       latestData.stochasticRsi < 20 ? 'Extreme' :
                       latestData.stochasticRsi > 60 ? 'High' :
                       latestData.stochasticRsi < 40 ? 'Low' :
                       'Neutral'}
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-md bg-muted/20 mb-3">
                    <p className="text-sm">
                      {latestData.stochasticRsi > 80 ? 'Extremely overbought, high probability of reversal. Watch for stochastic hooks down as entry signals.' : 
                       latestData.stochasticRsi < 20 ? 'Extremely oversold, high probability of reversal. Watch for stochastic hooks up as entry signals.' :
                       latestData.stochasticRsi > 60 ? 'Strong momentum trending higher. Favorable for continuation of bullish moves.' :
                       latestData.stochasticRsi < 40 ? 'Weak momentum trending lower. Favorable for continuation of bearish moves.' :
                       'Neutral reading without clear directional bias. Wait for confirmation or look for other signals.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Stoch RSI Direction:</div>
                    <div className={`text-sm font-medium ${
                      stochRsiTrend(historicalData) === 'up' ? 'text-green-600 dark:text-green-400' : 
                      stochRsiTrend(historicalData) === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {stochRsiTrend(historicalData) === 'up' ? 'Rising' : 
                       stochRsiTrend(historicalData) === 'down' ? 'Falling' : 
                       'Flat'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Divergence Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Momentum Divergence
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center mb-4">
                    {rsiDivergence(historicalData) === 'bullish' ? (
                      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <div className="font-bold text-green-600 dark:text-green-400 text-lg">Bullish Divergence</div>
                        <p className="text-sm text-green-800 dark:text-green-200">Price making lower lows while RSI making higher lows</p>
                      </div>
                    ) : rsiDivergence(historicalData) === 'bearish' ? (
                      <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto mb-2" />
                        <div className="font-bold text-red-600 dark:text-red-400 text-lg">Bearish Divergence</div>
                        <p className="text-sm text-red-800 dark:text-red-200">Price making higher highs while RSI making lower highs</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">No Divergence</div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">Price and momentum indicators are moving in alignment</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 rounded-md bg-muted/20">
                    <p className="text-sm">
                      {rsiDivergence(historicalData) === 'bullish' 
                        ? 'Bullish divergence often precedes price reversals to the upside. This is a strong signal for potential bullish setups.' 
                        : rsiDivergence(historicalData) === 'bearish' 
                        ? 'Bearish divergence often precedes price reversals to the downside. This is a strong signal for potential bearish setups.'
                        : 'No divergence detected between price and momentum indicators, suggesting the current trend may continue.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Last updated: {indicators.lastUpdated ? new Date(indicators.lastUpdated).toLocaleString() : 'N/A'}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Helper function to determine trend status based on EMAs
function determineTrendStatus(latestData: any) {
  if (latestData.ema10 > latestData.ema20 && latestData.ema20 > latestData.ema50) {
    return {
      type: 'bullish',
      label: 'Bullish',
      description: 'Strong uptrend with 10 EMA > 20 EMA > 50 EMA alignment.',
      emaDescription: 'EMAs are in bullish alignment with 10 above 20 above 50, indicating a strong uptrend.'
    };
  } else if (latestData.ema10 < latestData.ema20 && latestData.ema20 < latestData.ema50) {
    return {
      type: 'bearish',
      label: 'Bearish',
      description: 'Strong downtrend with 10 EMA < 20 EMA < 50 EMA alignment.',
      emaDescription: 'EMAs are in bearish alignment with 10 below 20 below 50, indicating a strong downtrend.'
    };
  } else if (latestData.ema10 > latestData.ema20 && latestData.ema20 < latestData.ema50) {
    return {
      type: 'neutral',
      label: 'Potential Reversal Up',
      description: '10 EMA crossed above 20 EMA but still below 50 EMA, potential reversal up.',
      emaDescription: '10 EMA crossed above 20 EMA but price remains below 50 EMA, suggesting a potential bullish reversal in development.'
    };
  } else if (latestData.ema10 < latestData.ema20 && latestData.ema20 > latestData.ema50) {
    return {
      type: 'neutral',
      label: 'Potential Reversal Down',
      description: '10 EMA crossed below 20 EMA but still above 50 EMA, potential reversal down.',
      emaDescription: '10 EMA crossed below 20 EMA but price remains above 50 EMA, suggesting a potential bearish reversal in development.'
    };
  } else {
    return {
      type: 'neutral',
      label: 'Neutral',
      description: 'No clear trend with mixed EMA signals.',
      emaDescription: 'EMAs are showing mixed signals without a clear trend direction.'
    };
  }
}

// Helper function to determine sentiment status based on PCR and IV
function determineSentimentStatus(pcr: number, iv: number) {
  const ivThreshold = iv > 50 ? 'high' : iv > 30 ? 'moderate' : 'low';
  
  if (ivThreshold === 'high') {
    if (pcr < 0.5) {
      return {
        type: 'bullish',
        label: 'Very Bullish',
        description: 'Strong call buying despite high IV environment.'
      };
    } else if (pcr > 1.5) {
      return {
        type: 'bearish',
        label: 'Very Bearish',
        description: 'Heavy put buying in high IV environment, suggests extreme fear.'
      };
    }
  } else if (ivThreshold === 'moderate') {
    if (pcr < 0.8) {
      return {
        type: 'bullish',
        label: 'Bullish',
        description: 'Call buying outpacing put buying in normal volatility conditions.'
      };
    } else if (pcr > 1.2) {
      return {
        type: 'bearish',
        label: 'Bearish',
        description: 'Put buying outpacing call buying in normal volatility conditions.'
      };
    }
  } else { // low IV
    if (pcr < 0.7) {
      return {
        type: 'bullish',
        label: 'Moderately Bullish',
        description: 'Call buying exceeds put buying in low volatility environment.'
      };
    } else if (pcr > 1.3) {
      return {
        type: 'bearish',
        label: 'Moderately Bearish',
        description: 'Put buying exceeds call buying in low volatility environment.'
      };
    }
  }
  
  return {
    type: 'neutral',
    label: 'Neutral',
    description: 'Balanced options activity between calls and puts.'
  };
}

// Helper function to determine momentum status from RSI and Stochastic RSI
function determineMomentumStatus(rsi: number, stochRsi: number) {
  if (rsi > 70 && stochRsi > 80) {
    return {
      type: 'bearish',
      label: 'Overbought',
      description: 'Extremely overbought on both RSI and Stochastic RSI, potential reversal down.'
    };
  } else if (rsi < 30 && stochRsi < 20) {
    return {
      type: 'bullish',
      label: 'Oversold',
      description: 'Extremely oversold on both RSI and Stochastic RSI, potential reversal up.'
    };
  } else if (rsi > 60 && stochRsi > 60) {
    return {
      type: 'bullish',
      label: 'Strong Momentum',
      description: 'Strong bullish momentum with both RSI and Stochastic RSI elevated.'
    };
  } else if (rsi < 40 && stochRsi < 40) {
    return {
      type: 'bearish',
      label: 'Weak Momentum',
      description: 'Weak momentum with both RSI and Stochastic RSI depressed.'
    };
  } else if ((rsi > 50 && stochRsi < 30) || (rsi < 50 && stochRsi > 70)) {
    return {
      type: 'neutral',
      label: 'Divergence',
      description: 'Divergence between RSI and Stochastic RSI signals potential reversal.'
    };
  } else {
    return {
      type: 'neutral',
      label: 'Neutral',
      description: 'Momentum indicators in neutral territory, no clear signal.'
    };
  }
}

// Helper function to format large numbers
function formatLargeNumber(num: number | null | undefined) {
  if (num === null || num === undefined) {
    return 'N/A';
  }
  if (!num || !isFinite(num)) return 'N/A';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
}

// Helper function to calculate RSI trend
function rsiTrend(historicalData: any[]) {
  const last5Rsi = historicalData.slice(-5).map(d => d.rsi);
  
  if (last5Rsi[4] > last5Rsi[0] + 5) return 'up';
  if (last5Rsi[4] < last5Rsi[0] - 5) return 'down';
  return 'flat';
}

// Helper function to calculate Stochastic RSI trend
function stochRsiTrend(historicalData: any[]) {
  const last5StochRsi = historicalData.slice(-5).map(d => d.stochasticRsi);
  
  if (last5StochRsi[4] > last5StochRsi[0] + 10) return 'up';
  if (last5StochRsi[4] < last5StochRsi[0] - 10) return 'down';
  return 'flat';
}

// Helper function to check for RSI divergence
function rsiDivergence(historicalData: any[]) {
  if (!historicalData || historicalData.length < 10) {
    return 'none';
  }
  const last10Bars = historicalData.slice(-10);
  
  // Check for bullish divergence: price making lower lows, RSI making higher lows
  let priceLowerLow = false;
  let rsiHigherLow = false;
  
  if (last10Bars[9]?.close && last10Bars[5]?.close && last10Bars[0]?.close &&
      last10Bars[9].close < last10Bars[5].close && 
      last10Bars[5].close < last10Bars[0].close) {
    priceLowerLow = true;
  }
  
  if (last10Bars[9]?.rsi && last10Bars[5]?.rsi && last10Bars[0]?.rsi &&
      last10Bars[9].rsi > last10Bars[5].rsi && 
      last10Bars[5].rsi > last10Bars[0].rsi) {
    rsiHigherLow = true;
  }
  
  if (priceLowerLow && rsiHigherLow) return 'bullish';
  
  // Check for bearish divergence: price making higher highs, RSI making lower highs
  let priceHigherHigh = false;
  let rsiLowerHigh = false;
  
  if (last10Bars[9]?.close && last10Bars[5]?.close && last10Bars[0]?.close &&
      last10Bars[9].close > last10Bars[5].close && 
      last10Bars[5].close > last10Bars[0].close) {
    priceHigherHigh = true;
  }
  
  if (last10Bars[9]?.rsi && last10Bars[5]?.rsi && last10Bars[0]?.rsi &&
      last10Bars[9].rsi < last10Bars[5].rsi && 
      last10Bars[5].rsi < last10Bars[0].rsi) {
    rsiLowerHigh = true;
  }
  
  if (priceHigherHigh && rsiLowerHigh) return 'bearish';
  
  return 'none';
}