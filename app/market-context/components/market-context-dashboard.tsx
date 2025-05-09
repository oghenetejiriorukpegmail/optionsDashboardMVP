"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MarketContext {
  price: {
    ticker: string;
    date: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  technicals: {
    ticker: string;
    date: string;
    timestamp: number;
    ema_10: number;
    ema_20: number;
    ema_50: number;
    rsi_14: number;
    stoch_rsi: number;
  };
  sentiment: {
    ticker: string;
    date: string;
    timestamp: number;
    pcr: number;
    iv_percentile: number;
    max_pain: number;
    gamma_exposure: number;
  };
}

interface HistoricalData {
  data: Array<{
    id: number;
    ticker: string;
    date: string;
    timestamp: number;
    [key: string]: any;
  }>;
}

export function MarketContextDashboard() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [priceHistory, setPriceHistory] = useState<HistoricalData | null>(null);
  const [technicalHistory, setTechnicalHistory] = useState<HistoricalData | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<HistoricalData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Initialize when component mounts
  useEffect(() => {
    fetchTickers();
  }, []);
  
  // Fetch data when ticker changes
  useEffect(() => {
    if (selectedTicker) {
      fetchMarketContext();
      fetchHistoricalData();
    }
  }, [selectedTicker]);
  
  // Fetch tickers from API
  const fetchTickers = async () => {
    try {
      const response = await fetch('/api/tickers');
      const data = await response.json();
      
      if (data.tickers && data.tickers.length > 0) {
        setTickers(data.tickers);
        setSelectedTicker(data.tickers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tickers',
        variant: 'destructive',
      });
    }
  };
  
  // Fetch market context for selected ticker
  const fetchMarketContext = async () => {
    if (!selectedTicker) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/market-context?ticker=${selectedTicker}`);
      const data = await response.json();
      
      setMarketContext(data);
    } catch (error) {
      console.error('Failed to fetch market context:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch market context',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch historical data for charts
  const fetchHistoricalData = async () => {
    if (!selectedTicker) return;
    
    try {
      // Fetch price history
      const priceResponse = await fetch(`/api/historical-data?ticker=${selectedTicker}&type=price&days=30`);
      const priceData = await priceResponse.json();
      setPriceHistory(priceData);
      
      // Fetch technical indicators history
      const techResponse = await fetch(`/api/historical-data?ticker=${selectedTicker}&type=technical&days=30`);
      const techData = await techResponse.json();
      setTechnicalHistory(techData);
      
      // Fetch sentiment history
      const sentimentResponse = await fetch(`/api/historical-data?ticker=${selectedTicker}&type=sentiment&days=30`);
      const sentimentData = await sentimentResponse.json();
      setSentimentHistory(sentimentData);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch historical data for charts',
        variant: 'destructive',
      });
    }
  };
  
  // Refresh data
  const refreshData = () => {
    fetchMarketContext();
    fetchHistoricalData();
  };
  
  // Helper function to determine trend based on EMAs
  const getTrendInfo = () => {
    if (!marketContext?.technicals) return { type: 'unknown', label: 'Unknown', icon: null };
    
    const { ema_10, ema_20, ema_50 } = marketContext.technicals;
    
    if (ema_10 > ema_20 && ema_20 > ema_50) {
      return { 
        type: 'bullish', 
        label: 'Bullish', 
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'text-green-500'
      };
    } else if (ema_10 < ema_20 && ema_20 < ema_50) {
      return { 
        type: 'bearish', 
        label: 'Bearish', 
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        color: 'text-red-500'
      };
    } else {
      return { 
        type: 'neutral', 
        label: 'Neutral', 
        icon: <LineChart className="h-5 w-5 text-yellow-500" />,
        color: 'text-yellow-500'
      };
    }
  };
  
  // Format dates for charts
  const formatChartDates = (data: any[] | undefined) => {
    if (!data) return [];
    return data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  };
  
  // Price chart data
  const priceChartData = {
    labels: formatChartDates(priceHistory?.data),
    datasets: [
      {
        label: 'Price',
        data: priceHistory?.data?.map(item => item.close) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'EMA 10',
        data: technicalHistory?.data?.map(item => item.ema_10) || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'EMA 20',
        data: technicalHistory?.data?.map(item => item.ema_20) || [],
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
      {
        label: 'EMA 50',
        data: technicalHistory?.data?.map(item => item.ema_50) || [],
        borderColor: 'rgb(255, 206, 86)',
        tension: 0.1,
      },
    ],
  };
  
  // RSI chart data
  const rsiChartData = {
    labels: formatChartDates(technicalHistory?.data),
    datasets: [
      {
        label: 'RSI (14)',
        data: technicalHistory?.data?.map(item => item.rsi_14) || [],
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
      },
      {
        label: 'Stochastic RSI',
        data: technicalHistory?.data?.map(item => item.stoch_rsi) || [],
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1,
      },
    ],
  };
  
  // Sentiment chart data
  const sentimentChartData = {
    labels: formatChartDates(sentimentHistory?.data),
    datasets: [
      {
        label: 'Put-Call Ratio',
        data: sentimentHistory?.data?.map(item => item.pcr) || [],
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'IV Percentile',
        data: sentimentHistory?.data?.map(item => item.iv_percentile) || [],
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };
  
  const trendInfo = getTrendInfo();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium mb-1">Ticker</label>
          <Select value={selectedTicker} onValueChange={setSelectedTicker}>
            <SelectTrigger>
              <SelectValue placeholder="Select ticker" />
            </SelectTrigger>
            <SelectContent>
              {tickers.map(ticker => (
                <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={refreshData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
      
      {marketContext ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Price Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${marketContext.price?.close.toFixed(2)}</div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span>${marketContext.price?.open.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span>${marketContext.price?.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span>${marketContext.price?.low.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume:</span>
                  <span>{(marketContext.price?.volume / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Technical Indicators Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Technical Indicators</CardTitle>
                <div className={`flex items-center ${trendInfo.color}`}>
                  {trendInfo.icon}
                  <span className="ml-1">{trendInfo.label}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EMA (10):</span>
                  <span>${marketContext.technicals?.ema_10.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EMA (20):</span>
                  <span>${marketContext.technicals?.ema_20.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EMA (50):</span>
                  <span>${marketContext.technicals?.ema_50.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI (14):</span>
                  <span>{marketContext.technicals?.rsi_14.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stochastic RSI:</span>
                  <span>{marketContext.technicals?.stoch_rsi.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Market Sentiment Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Put-Call Ratio:</span>
                  <span>{marketContext.sentiment?.pcr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IV Percentile:</span>
                  <span>{marketContext.sentiment?.iv_percentile.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Pain:</span>
                  <span>${marketContext.sentiment?.max_pain.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gamma Exposure:</span>
                  <span>
                    ${(marketContext.sentiment?.gamma_exposure / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center p-6">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading market context...</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a ticker to view market context</span>
            )}
          </CardContent>
        </Card>
      )}
      
      {marketContext && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price & Moving Averages</CardTitle>
              <CardDescription>
                Price action with 10, 20, and 50-day EMAs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={priceChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>RSI & Stochastic RSI</CardTitle>
                <CardDescription>
                  Momentum indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line 
                    data={rsiChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>
                  Put-Call Ratio and IV Percentile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line 
                    data={sentimentChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Put-Call Ratio'
                          }
                        },
                        y1: {
                          position: 'right',
                          min: 0,
                          max: 100,
                          title: {
                            display: true,
                            text: 'IV Percentile'
                          },
                          grid: {
                            drawOnChartArea: false
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
