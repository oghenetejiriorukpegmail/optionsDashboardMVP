"use client";

import { fetchScannerResults, fetchWatchlist, WatchlistItem } from "@/lib/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpRight, 
  Activity,
  BarChart4, 
  Eye, 
  AlertTriangle,
  ChevronRight, 
  Zap,
  Loader2
} from "lucide-react";

// Define types for the scanner data
interface SetupCounts {
  bullish: number;
  bearish: number;
  neutral: number;
}

interface ScannerResult {
  symbol: string;
  setupType: string;
  emaTrend: string;
  pcr: number;
  rsi: number;
  setupStrength: string;
  price?: number;
}

interface MarketSummary {
  sentiment: string;
  pcrAggregate: number | string;
  gexAggregate: number;
  volatility: string;
}

interface ScannerData {
  setupCounts: SetupCounts;
  results: ScannerResult[];
  marketSummary: MarketSummary;
  limit?: number; // Add limit to the type
}

// Helper function to return setup type icon
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

export default function Dashboard() {
  const [scannerData, setScannerData] = useState<ScannerData | null>(null);
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const scannerResults = await fetchScannerResults();
      const watchlist = await fetchWatchlist();
      
      setScannerData(scannerResults);
      setWatchlistData(watchlist);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    try {
      setRefreshing(true);
      const scannerResults = await fetchScannerResults({ refresh: true });
      const watchlist = await fetchWatchlist();
      
      setScannerData(scannerResults);
      setWatchlistData(watchlist);
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setRefreshing(false);
    }
  }

  // Format market sentiment based on data
  const getSentimentBadge = (sentiment: string) => {
    const bgColor = 
      sentiment?.toLowerCase().includes('bullish') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
      sentiment?.toLowerCase().includes('bearish') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor}`}>
        {sentiment}
      </span>
    );
  };
  
  // Ensure scannerData.results is an array
  const scannerResults = Array.isArray(scannerData?.results) ? scannerData.results : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Options-Technical Hybrid Strategy Scanner for NASDAQ 100
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={refreshing} 
            className="w-full sm:w-auto"
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
          <Link href="/scanner" className="w-full sm:w-auto">
            <Button className="w-full">
              <BarChart4 className="mr-2 h-4 w-4" />
              Advanced Scanner
            </Button>
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Market Summary Card */}
          <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
            <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Market Pulse
              </CardTitle>
              <CardDescription>
                Current market sentiment and trend overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart4 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">SENTIMENT</h3>
                  </div>
                  <p className="text-2xl font-semibold">
                    {getSentimentBadge(scannerData?.marketSummary?.sentiment || 'Neutral')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PCR: <span className="font-medium">{scannerData?.marketSummary?.pcrAggregate || 'N/A'}</span> | 
                    GEX: <span className={`font-medium ${(scannerData?.marketSummary?.gexAggregate ?? 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(scannerData?.marketSummary?.gexAggregate ?? 0).toLocaleString()}M
                    </span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">SETUPS</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
                      <span className="text-lg font-semibold">{scannerData?.setupCounts?.bullish || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-red-500"></span>
                      <span className="text-lg font-semibold">{scannerData?.setupCounts?.bearish || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
                      <span className="text-lg font-semibold">{scannerData?.setupCounts?.neutral || 0}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {scannerData?.limit || 10} analyzed NASDAQ stocks
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">VOLATILITY</h3>
                  </div>
                  <p className="text-2xl font-semibold">
                    {scannerData?.marketSummary?.volatility || 'Normal'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(scannerData?.marketSummary?.volatility || '').toLowerCase().includes('high') 
                      ? 'Caution advised with position sizing' 
                      : (scannerData?.marketSummary?.volatility || '').toLowerCase().includes('low')
                        ? 'Consider strategies with wider profit zones'
                        : 'Normal trading conditions'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/market-context" className="text-sm text-primary hover:underline flex items-center">
                View detailed market analysis
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                Scanner Results
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="setups" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Top Setups
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scanner" className="space-y-4">              
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      Scanner Results
                    </CardTitle>
                    <CardDescription>
                      NASDAQ 100 stocks matching your strategy criteria
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground hidden md:block">
                      {scannerResults.length || 0} stocks analyzed
                    </span>
                    <Link href="/scanner">
                      <Button variant="outline" size="sm">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Advanced Filters
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Symbol</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Setup</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">EMA Trend</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">PCR</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">RSI</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Strength</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {scannerResults.slice(0, 10).map((result) => (
                            <tr key={result.symbol} className="border-b transition-colors hover:bg-muted/20">
                              <td className="p-2 px-4 align-middle font-medium">{result.symbol}</td>
                              <td className="p-2 px-4 align-middle">${result.price?.toFixed(2) || 'N/A'}</td>
                              <td className="p-2 px-4 align-middle">
                                <div className="flex items-center gap-1">
                                  {getSetupIcon(result.setupType)}
                                  <span className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-medium",
                                    {
                                      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": result.setupType === 'bullish',
                                      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": result.setupType === 'bearish',
                                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": result.setupType === 'neutral'
                                    }
                                  )}>
                                    {result.setupType.charAt(0).toUpperCase() + result.setupType.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 px-4 align-middle hidden md:table-cell">{result.emaTrend}</td>
                              <td className="p-2 px-4 align-middle font-mono">{result.pcr.toFixed(2)}</td>
                              <td className="p-2 px-4 align-middle font-mono">{result.rsi.toFixed(1)}</td>
                              <td className="p-2 px-4 align-middle hidden md:table-cell">
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  {
                                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": result.setupStrength === 'strong',
                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200": result.setupStrength === 'moderate',
                                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": result.setupStrength === 'weak'
                                  }
                                )}>
                                  {result.setupStrength.charAt(0).toUpperCase() + result.setupStrength.slice(1)}
                                </span>
                              </td>
                              <td className="p-2 px-4 align-middle text-right">
                                <Link href={`/scanner?symbol=${result.symbol}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                          {(scannerResults.length === 0) && (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                No scanner results available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                {scannerResults.length > 10 && (
                  <CardFooter className="flex justify-center">
                    <Link href="/scanner">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        View all {scannerResults.length} results
                      </Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="watchlist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    My Watchlist
                  </CardTitle>
                  <CardDescription>
                    Stocks you're monitoring for potential trade opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Symbol</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Current Price</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Setup</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Entry Target</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Stop Loss</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {watchlistData.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                No stocks in watchlist. Add stocks from the scanner.
                              </td>
                            </tr>
                          ) : (
                            watchlistData.map((item) => (
                              <tr key={item.symbol} className="border-b transition-colors hover:bg-muted/20">
                                <td className="p-2 px-4 align-middle font-medium">{item.symbol}</td>
                                <td className="p-2 px-4 align-middle">${item.price.toFixed(2)}</td>
                                <td className="p-2 px-4 align-middle">
                                  <div className="flex items-center gap-1">
                                    {getSetupIcon(item.setupType)}
                                    <span className={cn(
                                      "rounded-full px-2 py-0.5 text-xs font-medium",
                                      {
                                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": item.setupType === 'bullish',
                                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": item.setupType === 'bearish',
                                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": item.setupType === 'neutral'
                                      }
                                    )}>
                                      {item.setupType.charAt(0).toUpperCase() + item.setupType.slice(1)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 px-4 align-middle hidden md:table-cell">${item.entryTarget.toFixed(2)}</td>
                                <td className="p-2 px-4 align-middle hidden md:table-cell">{typeof item.stopLoss === 'number' ? `$${item.stopLoss.toFixed(2)}` : item.stopLoss}</td>
                                <td className="p-2 px-4 align-middle text-right">
                                  <div className="flex justify-end gap-1">
                                    <Link href={`/scanner?symbol=${item.symbol}`}>
                                      <Button variant="outline" size="sm" className="h-8">View</Button>
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                {watchlistData.length > 0 && (
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Add Symbol
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage Watchlist
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="setups" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Bullish Setups Card */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Bullish Setups
                    </CardTitle>
                    <CardDescription>
                      Stocks with strong upward momentum
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scannerResults.filter(r => r.setupType === 'bullish').slice(0, 4).map((stock) => (
                        <Link 
                          key={stock.symbol} 
                          href={`/scanner?symbol=${stock.symbol}`}
                          className="flex items-center justify-between p-2 rounded-md border border-transparent hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-950 dark:hover:border-green-900 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 h-8 w-8 rounded-full flex items-center justify-center font-bold">
                              {stock.symbol.substring(0, 1)}
                            </span>
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground">RSI: {stock.rsi.toFixed(1)} | PCR: {stock.pcr.toFixed(2)}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                      
                      {(scannerResults.filter(r => r.setupType === 'bullish').length === 0) && (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                          <p>No bullish setups found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href="/scanner?setup=bullish" className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center">
                      View all bullish setups
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardFooter>
                </Card>
                
                {/* Bearish Setups Card */}
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Bearish Setups
                    </CardTitle>
                    <CardDescription>
                      Stocks with downward momentum patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scannerResults.filter(r => r.setupType === 'bearish').slice(0, 4).map((stock) => (
                        <Link 
                          key={stock.symbol} 
                          href={`/scanner?symbol=${stock.symbol}`}
                          className="flex items-center justify-between p-2 rounded-md border border-transparent hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:border-red-900 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 h-8 w-8 rounded-full flex items-center justify-center font-bold">
                              {stock.symbol.substring(0, 1)}
                            </span>
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground">RSI: {stock.rsi.toFixed(1)} | PCR: {stock.pcr.toFixed(2)}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                      
                      {(scannerResults.filter(r => r.setupType === 'bearish').length === 0) && (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                          <p>No bearish setups found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href="/scanner?setup=bearish" className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center">
                      View all bearish setups
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardFooter>
                </Card>
                
                {/* Neutral Setups Card */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Minus className="h-5 w-5 text-blue-500" />
                      Neutral Setups
                    </CardTitle>
                    <CardDescription>
                      Stocks in consolidation phases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scannerResults.filter(r => r.setupType === 'neutral').slice(0, 4).map((stock) => (
                        <Link 
                          key={stock.symbol} 
                          href={`/scanner?symbol=${stock.symbol}`}
                          className="flex items-center justify-between p-2 rounded-md border border-transparent hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:border-blue-900 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 h-8 w-8 rounded-full flex items-center justify-center font-bold">
                              {stock.symbol.substring(0, 1)}
                            </span>
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground">RSI: {stock.rsi.toFixed(1)} | PCR: {stock.pcr.toFixed(2)}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                      
                      {(scannerResults.filter(r => r.setupType === 'neutral').length === 0) && (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                          <p>No neutral setups found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href="/scanner?setup=neutral" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                      View all neutral setups
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
