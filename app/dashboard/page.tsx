"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Target, 
  CheckCircle, 
  PieChart, 
  LineChart, 
  Search, 
  ArrowRight, 
  RefreshCcw,
  Shield,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchScannerResults } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    tickers: 0,
    bullishSetups: 0,
    bearishSetups: 0,
    neutralSetups: 0,
    lastUpdate: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load latest scanner data for dashboard
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchScannerResults({ limit: 100 });
        
        if (data && data.results) {
          // Calculate stats from scanner results
          const results = Array.isArray(data.results) ? data.results : Object.values(data.results);
          const bullishCount = results.filter((r: any) => r && r.setupType === 'bullish').length;
          const bearishCount = results.filter((r: any) => r && r.setupType === 'bearish').length;
          const neutralCount = results.filter((r: any) => r && r.setupType === 'neutral').length;
          
          setStats({
            tickers: results.length,
            bullishSetups: bullishCount,
            bearishSetups: bearishCount,
            neutralSetups: neutralCount,
            lastUpdate: new Date().toLocaleString()
          });
        }
      } catch (error) {
        console.error('Error fetching scanner data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLatestData();
  }, []);

  // Feature cards for the dashboard
  const features = [
    {
      title: 'Market Context',
      description: 'Analyze market trends, momentum, and sentiment using technical and options data',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/market-context',
      status: 'Live',
      metrics: 'EMA Trends, RSI, PCR Analysis',
      color: 'blue',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-l-blue-500'
    },
    {
      title: 'Trade Setups',
      description: 'Review rules for bullish, bearish, and neutral setups with options confirmation',
      icon: <Target className="h-5 w-5" />,
      path: '/trade-setup',
      status: 'Live',
      metrics: 'Pattern Recognition, OI Analysis',
      color: 'green',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
      borderColor: 'border-l-green-500'
    },
    {
      title: 'Confirmation',
      description: 'Validate trade setups with entry and exit confirmation signals',
      icon: <CheckCircle className="h-5 w-5" />,
      path: '/confirmation',
      status: 'Live',
      metrics: 'Technical Signals, Options Validation',
      color: 'purple',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      borderColor: 'border-l-purple-500'
    },
    {
      title: 'Risk Management',
      description: 'Calculate position size based on account risk and volatility',
      icon: <Shield className="h-5 w-5" />,
      path: '/risk-management',
      status: 'Live',
      metrics: 'Position Sizing, R:R Calculation',
      color: 'amber',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      borderColor: 'border-l-amber-500'
    },
    {
      title: 'Key Levels',
      description: 'Identify support and resistance using options data and technical levels',
      icon: <LineChart className="h-5 w-5" />,
      path: '/key-levels',
      status: 'Live',
      metrics: 'Options Chain, Max Pain, Greeks',
      color: 'indigo',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      borderColor: 'border-l-indigo-500'
    },
    {
      title: 'Scanner',
      description: 'Find trade opportunities with advanced filtering on technical and options data',
      icon: <Search className="h-5 w-5" />,
      path: '/scanner',
      status: 'Live',
      metrics: 'Hybrid Analysis, Custom Filters',
      color: 'sky',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-500',
      borderColor: 'border-l-sky-500'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Options-Technical Hybrid Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            A comprehensive trading platform combining options analytics and technical analysis for identifying high-probability trade opportunities.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/scanner">
              <Search className="mr-2 h-4 w-4" />
              Advanced Scanner
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-8 w-16 bg-slate-200 rounded"></div>
              ) : (
                stats.tickers
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available in scanner database
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute left-0 bottom-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Setup Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse h-8 w-full bg-slate-200 rounded"></div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Bullish
                  </span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                    {stats.bullishSetups}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Bearish
                  </span>
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
                    {stats.bearishSetups}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Neutral
                  </span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                    {stats.neutralSetups}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute right-0 bottom-0 -mb-4 -mr-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/scanner">
                  <Search className="mr-2 h-4 w-4" />
                  Scanner
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/market-context">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Market Analysis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute left-0 top-0 -mt-4 -ml-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm">{isLoading ? 'Updating...' : 'Live'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {stats.lastUpdate || 'Updating...'}
            </p>
            <Button variant="ghost" size="sm" className="mt-2 h-8 w-8 p-0" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card
            key={index}
            className={`overflow-hidden bg-gradient-to-br from-background to-muted/50 relative border-l-4 ${feature.borderColor}`}
          >
            <div className="absolute right-0 top-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
            <div className="absolute left-0 bottom-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md font-bold flex items-center">
                  <span className={`rounded-full w-8 h-8 ${feature.iconBg} flex items-center justify-center mr-2`}>
                    <span className={feature.iconColor}>{feature.icon}</span>
                  </span>
                  {feature.title}
                </CardTitle>
                <Badge variant="outline" className={`${
                    feature.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800' :
                    feature.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' :
                    feature.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800' :
                    feature.color === 'amber' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800' :
                    feature.color === 'indigo' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800' :
                    'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800'
                  }`}>
                  {feature.status}
                </Badge>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {feature.metrics}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                asChild
                variant="outline"
                className="w-full group border border-transparent hover:border-primary/20"
              >
                <Link href={feature.path} className="w-full flex items-center justify-center">
                  <span>View {feature.title}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Additional Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-xl"></div>
          <div className="absolute left-0 bottom-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              About This Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              This dashboard combines options data analytics with technical analysis to identify high-probability trading opportunities.
              By analyzing options chain data, implied volatility, and technical indicators, the platform provides a comprehensive
              approach to options trading.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Options Chain Analysis</Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Technical Patterns</Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Sentiment Metrics</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 relative overflow-hidden border">
          <div className="absolute right-0 bottom-0 -mb-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-xl"></div>
          <div className="absolute left-0 top-0 -mt-8 -ml-8 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-500/10 p-2 rounded-full mr-3">
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Begin with Market Context</h3>
                <p className="text-xs text-muted-foreground">Understand current market conditions and sentiment</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-sky-500/10 p-2 rounded-full mr-3">
                <Search className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Run the Scanner</h3>
                <p className="text-xs text-muted-foreground">Find potential setups that match your criteria</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-amber-500/10 p-2 rounded-full mr-3">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Apply Risk Management</h3>
                <p className="text-xs text-muted-foreground">Calculate appropriate position sizes and risk levels</p>
              </div>
            </div>
            <Button asChild className="w-full mt-2 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600">
              <Link href="/scanner">Start Scanning <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}