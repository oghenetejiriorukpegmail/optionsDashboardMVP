"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { MARKET_INDEXES } from '@/lib/config/market-indexes';

interface MarketIndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  trend: string;
  rsi?: number;
  distanceFrom20MA?: number;
}

interface MarketContext {
  timestamp: string;
  marketSentiment: string;
  volatility: {
    vix: number;
    level: string;
  };
  indexes: MarketIndexData[];
  breadth: {
    advancing: number;
    declining: number;
    neutral: number;
    advanceDeclineRatio: number;
  };
  summary: string;
}

export default function MarketContextDashboard() {
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMarketContext = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/market-context');
      
      if (!response.ok) {
        throw new Error('Failed to fetch market context');
      }
      
      const data = await response.json();
      setMarketContext(data);
    } catch (error) {
      console.error('Error fetching market context:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch market context. Please refresh market index data first.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketContext();
  }, []);

  const refreshMarketIndexes = async () => {
    try {
      const response = await fetch('/api/collect-market-indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'core' }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh market indexes');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: `Refreshed ${data.successful} market indexes`,
      });

      // Refresh the display after data collection
      fetchMarketContext();
    } catch (error) {
      console.error('Error refreshing market indexes:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh market indexes',
        variant: 'destructive',
      });
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('Bullish')) return 'text-green-600';
    if (sentiment.includes('Bearish')) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getVolatilityColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500';
      case 'Normal': return 'bg-blue-500';
      case 'High': return 'bg-yellow-500';
      case 'Extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0.1) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < -0.1) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (loading && !marketContext) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!marketContext) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">No market data available</p>
          <Button onClick={refreshMarketIndexes}>Refresh Market Indexes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>{marketContext.summary}</CardDescription>
            </div>
            <Button
              onClick={refreshMarketIndexes}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Refresh Indexes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Sentiment */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Market Sentiment</div>
              <div className={`text-2xl font-bold ${getSentimentColor(marketContext.marketSentiment)}`}>
                {marketContext.marketSentiment}
              </div>
            </div>

            {/* Volatility */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Volatility (VIX)</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{marketContext.volatility.vix.toFixed(2)}</span>
                <Badge className={getVolatilityColor(marketContext.volatility.level)}>
                  {marketContext.volatility.level}
                </Badge>
              </div>
            </div>

            {/* Market Breadth */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Market Breadth</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{marketContext.breadth.advancing}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{marketContext.breadth.declining}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  A/D: {marketContext.breadth.advanceDeclineRatio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Major Indexes */}
      <Card>
        <CardHeader>
          <CardTitle>Major Market Indexes</CardTitle>
          <CardDescription>Real-time performance of key market indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketContext.indexes.map((index) => {
              const indexInfo = MARKET_INDEXES[index.symbol as keyof typeof MARKET_INDEXES];
              return (
                <div key={index.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{index.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {indexInfo?.name || index.name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {indexInfo?.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">${index.price.toFixed(2)}</div>
                      <div className={`flex items-center gap-1 text-sm ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {getTrendIcon(index.changePercent)}
                        <span>{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}</span>
                        <span>({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={index.trend.includes('Uptrend') ? 'default' : index.trend.includes('Downtrend') ? 'destructive' : 'secondary'}>
                        {index.trend}
                      </Badge>
                      {index.rsi && (
                        <span className="text-xs text-muted-foreground">RSI: {index.rsi.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketContext.indexes.map((index) => (
                <div key={index.symbol} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{index.symbol}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">20MA:</span>
                    <span className={`text-sm font-medium ${index.distanceFrom20MA && index.distanceFrom20MA > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {index.distanceFrom20MA ? `${index.distanceFrom20MA >= 0 ? '+' : ''}${index.distanceFrom20MA.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market Health Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Bullish Momentum</span>
                  <span className="text-sm font-medium">
                    {((marketContext.breadth.advancing / marketContext.indexes.length) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(marketContext.breadth.advancing / marketContext.indexes.length) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Market Volatility</span>
                  <span className="text-sm font-medium">{marketContext.volatility.level}</span>
                </div>
                <Progress 
                  value={Math.min((marketContext.volatility.vix / 40) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}