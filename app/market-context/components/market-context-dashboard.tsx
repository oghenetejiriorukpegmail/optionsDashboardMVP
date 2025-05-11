"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart2,
  Activity
} from 'lucide-react';
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
  
  // Helper function to determine trend based on EMAs with more nuanced analysis
  const getTrendInfo = () => {
    if (!marketContext?.technicals) return { type: 'unknown', label: 'Unknown', icon: null };

    const { ema_10, ema_20, ema_50 } = marketContext.technicals;
    const { rsi_14 } = marketContext.technicals || { rsi_14: 50 };
    const { pcr } = marketContext.sentiment || { pcr: 1.0 };

    // Strong bullish trend: 10 > 20 > 50 EMA, plus RSI > 50, PCR < 0.9
    if (ema_10 > ema_20 && ema_20 > ema_50 && rsi_14 > 50 && pcr < 0.9) {
      return {
        type: 'strong_bullish',
        label: 'Strong Bullish',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'text-green-500',
        description: 'Strong uptrend with bullish momentum and bullish options sentiment'
      };
    }
    // Bullish trend: 10 > 20 > 50 EMA
    else if (ema_10 > ema_20 && ema_20 > ema_50) {
      return {
        type: 'bullish',
        label: 'Bullish',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'text-green-500',
        description: 'Uptrend with bullish momentum'
      };
    }
    // Strong bearish trend: 10 < 20 < 50 EMA, plus RSI < 50, PCR > 1.1
    else if (ema_10 < ema_20 && ema_20 < ema_50 && rsi_14 < 50 && pcr > 1.1) {
      return {
        type: 'strong_bearish',
        label: 'Strong Bearish',
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        color: 'text-red-500',
        description: 'Strong downtrend with bearish momentum and bearish options sentiment'
      };
    }
    // Bearish trend: 10 < 20 < 50 EMA
    else if (ema_10 < ema_20 && ema_20 < ema_50) {
      return {
        type: 'bearish',
        label: 'Bearish',
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        color: 'text-red-500',
        description: 'Downtrend with bearish momentum'
      };
    }
    // Transition to bullish: 10 > 20 < 50 EMA
    else if (ema_10 > ema_20 && ema_20 < ema_50) {
      return {
        type: 'transition_bullish',
        label: 'Trend Reversal (Bullish)',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'text-green-500',
        description: 'Potential bullish trend reversal forming'
      };
    }
    // Transition to bearish: 10 < 20 > 50 EMA
    else if (ema_10 < ema_20 && ema_20 > ema_50) {
      return {
        type: 'transition_bearish',
        label: 'Trend Reversal (Bearish)',
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        color: 'text-red-500',
        description: 'Potential bearish trend reversal forming'
      };
    }
    // Neutral/Consolidation
    else {
      return {
        type: 'neutral',
        label: 'Neutral/Consolidation',
        icon: <LineChart className="h-5 w-5 text-yellow-500" />,
        color: 'text-yellow-500',
        description: 'Price in consolidation phase with no clear trend direction'
      };
    }
  };
  
  // Helper function to analyze momentum
  const getMomentumInfo = () => {
    if (!marketContext?.technicals) return { strength: 'unknown', status: 'Unknown', description: '' };

    const { rsi_14, stoch_rsi } = marketContext.technicals;

    // Overbought
    if (rsi_14 > 70) {
      return {
        strength: 'overbought',
        status: 'Overbought',
        description: 'RSI above 70 indicates potential reversal or pullback',
        color: 'text-red-500'
      };
    }
    // Oversold
    else if (rsi_14 < 30) {
      return {
        strength: 'oversold',
        status: 'Oversold',
        description: 'RSI below 30 indicates potential reversal or bounce',
        color: 'text-green-500'
      };
    }
    // Strong bullish momentum
    else if (rsi_14 > 60 && stoch_rsi > 60) {
      return {
        strength: 'strong',
        status: 'Strong Bullish Momentum',
        description: 'RSI and StochRSI indicate strong bullish momentum',
        color: 'text-green-500'
      };
    }
    // Strong bearish momentum
    else if (rsi_14 < 40 && stoch_rsi < 40) {
      return {
        strength: 'strong',
        status: 'Strong Bearish Momentum',
        description: 'RSI and StochRSI indicate strong bearish momentum',
        color: 'text-red-500'
      };
    }
    // Bullish momentum
    else if (rsi_14 > 50 && stoch_rsi > 50) {
      return {
        strength: 'moderate',
        status: 'Bullish Momentum',
        description: 'RSI and StochRSI above 50 indicate bullish momentum',
        color: 'text-green-500'
      };
    }
    // Bearish momentum
    else if (rsi_14 < 50 && stoch_rsi < 50) {
      return {
        strength: 'moderate',
        status: 'Bearish Momentum',
        description: 'RSI and StochRSI below 50 indicate bearish momentum',
        color: 'text-red-500'
      };
    }
    // Neutral momentum
    else {
      return {
        strength: 'weak',
        status: 'Neutral Momentum',
        description: 'RSI and StochRSI indicate no clear momentum direction',
        color: 'text-yellow-500'
      };
    }
  };

  // Helper function to interpret PCR and sentiment
  const getSentimentInfo = () => {
    if (!marketContext?.sentiment) return { type: 'unknown', label: 'Unknown', description: '' };

    const { pcr, iv_percentile, gamma_exposure } = marketContext.sentiment;

    // Extremely bullish
    if (pcr < 0.7 && gamma_exposure > 0) {
      return {
        type: 'extremely_bullish',
        label: 'Extremely Bullish',
        description: 'Very low PCR indicates strong call buying activity',
        color: 'text-green-600'
      };
    }
    // Bullish
    else if (pcr < 0.9) {
      return {
        type: 'bullish',
        label: 'Bullish',
        description: 'Low PCR indicates bullish sentiment among options traders',
        color: 'text-green-500'
      };
    }
    // Extremely bearish
    else if (pcr > 1.3 && gamma_exposure < 0) {
      return {
        type: 'extremely_bearish',
        label: 'Extremely Bearish',
        description: 'Very high PCR indicates strong put buying activity',
        color: 'text-red-600'
      };
    }
    // Bearish
    else if (pcr > 1.1) {
      return {
        type: 'bearish',
        label: 'Bearish',
        description: 'High PCR indicates bearish sentiment among options traders',
        color: 'text-red-500'
      };
    }
    // Neutral
    else {
      return {
        type: 'neutral',
        label: 'Neutral',
        description: 'Balanced PCR indicates neutral options sentiment',
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
              <p className={`text-sm mt-1 ${trendInfo.color}`}>{trendInfo.description}</p>
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

                {/* Momentum section */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Momentum</span>
                    <span className={getMomentumInfo().color}>{getMomentumInfo().status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{getMomentumInfo().description}</p>
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
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Market Sentiment</CardTitle>
                <span className={`${getSentimentInfo().color} font-medium`}>
                  {getSentimentInfo().label}
                </span>
              </div>
              <p className={`text-sm mt-1 ${getSentimentInfo().color}`}>{getSentimentInfo().description}</p>
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
                  <span className={marketContext.sentiment?.gamma_exposure > 0 ? "text-green-500" : "text-red-500"}>
                    ${(marketContext.sentiment?.gamma_exposure / 1000000).toFixed(2)}M
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center mb-2">
                    <span className="font-medium">Options Interpretation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {marketContext.sentiment?.pcr < 0.9 ? "Bullish call activity dominates" :
                     marketContext.sentiment?.pcr > 1.1 ? "Bearish put activity dominates" :
                     "Balanced options activity"}
                    {marketContext.sentiment?.iv_percentile > 70 ? ", with high implied volatility suggesting larger price swings" :
                     marketContext.sentiment?.iv_percentile < 30 ? ", with low implied volatility suggesting muted price action" :
                     ", with moderate implied volatility"}.
                    {marketContext.sentiment?.gamma_exposure > 0 ? " Positive gamma exposure may accelerate upside moves." :
                     marketContext.sentiment?.gamma_exposure < 0 ? " Negative gamma exposure may accelerate downside moves." : ""}
                  </p>
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
          {/* Market Analysis Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis Summary</CardTitle>
              <CardDescription>
                Combined analysis of technical indicators and options data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trend Analysis */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      {trendInfo.icon}
                      <h3 className={`text-lg font-medium ml-2 ${trendInfo.color}`}>Trend Analysis</h3>
                    </div>
                    <p className="text-sm">{trendInfo.description}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Based on EMA alignment, price action, and momentum
                    </div>
                  </div>

                  {/* Momentum Status */}
                  <div className="border rounded-lg p-4">
                    <h3 className={`text-lg font-medium ${getMomentumInfo().color}`}>
                      {getMomentumInfo().status}
                    </h3>
                    <p className="text-sm mt-2">{getMomentumInfo().description}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Based on RSI and Stochastic RSI readings
                    </div>
                  </div>

                  {/* Options Sentiment */}
                  <div className="border rounded-lg p-4">
                    <h3 className={`text-lg font-medium ${getSentimentInfo().color}`}>
                      {getSentimentInfo().label} Sentiment
                    </h3>
                    <p className="text-sm mt-2">{getSentimentInfo().description}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Based on Put-Call Ratio, IV Percentile, and Gamma Exposure
                    </div>
                  </div>
                </div>

                {/* Trading Implication */}
                <div className="border rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-medium mb-2">Trading Implications</h3>
                  <p className="text-sm">
                    {trendInfo.type.includes('bullish') && getSentimentInfo().type.includes('bullish') ?
                      "Strong bullish alignment between technical indicators and options sentiment. Consider bullish strategies with defined risk." :
                     trendInfo.type.includes('bearish') && getSentimentInfo().type.includes('bearish') ?
                      "Strong bearish alignment between technical indicators and options sentiment. Consider bearish strategies with defined risk." :
                     trendInfo.type.includes('bullish') && getSentimentInfo().type.includes('bearish') ?
                      "Mixed signals: Bullish technicals but bearish options sentiment. Proceed with caution and reduce position size." :
                     trendInfo.type.includes('bearish') && getSentimentInfo().type.includes('bullish') ?
                      "Mixed signals: Bearish technicals but bullish options sentiment. Proceed with caution and reduce position size." :
                      "Neutral market conditions. Consider range-bound strategies or reduced position sizing until clearer signals emerge."
                    }
                    {getMomentumInfo().strength === 'overbought' ?
                      " Be cautious of potential pullbacks due to overbought conditions." :
                     getMomentumInfo().strength === 'oversold' ?
                      " Watch for potential bounces from oversold conditions." : ""
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
