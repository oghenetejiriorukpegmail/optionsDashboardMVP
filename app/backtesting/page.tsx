"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Play, RefreshCw, Save, BarChart, LineChart, PieChart, BookOpen, Calendar, Clock, Share2, Activity, Settings } from 'lucide-react';

// Default backtest parameters
const DEFAULT_PARAMS = {
  // Ticker and date range
  ticker: 'SPY',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  
  // Trading strategy
  strategy: 'options-technical-hybrid',
  setupType: 'all', // 'all', 'bullish', 'bearish', 'neutral'
  entryConfirmation: true,
  exitStrategy: 'target-or-stop', // 'target-or-stop', 'fixed-days', 'trailing-stop'
  
  // Position sizing
  initialCapital: 10000,
  riskPerTrade: 2, // percentage of capital
  maxPositions: 5,
  
  // Advanced options
  useOptionsPositions: true,
  useStockPositions: false,
  commissionPerContract: 0.65,
  slippageModel: 'conservative', // 'conservative', 'moderate', 'aggressive'
  
  // Technical rules
  rsiOversold: 30,
  rsiOverbought: 70,
  emaPeriods: {
    short: 10,
    medium: 20,
    long: 50
  },
  
  // Options rules
  minDaysToExpiration: 30,
  maxDaysToExpiration: 60,
  targetDelta: 0.50,
  useIvRank: true,
  minIvRank: 30,
  maxIvRank: 80,
  
  // Optimization
  optimize: false,
  optimizeParameter: 'riskPerTrade', // 'riskPerTrade', 'targetDelta', 'rsiOversold', 'rsiOverbought'
  optimizeStart: 1,
  optimizeEnd: 5,
  optimizeSteps: 5,
};

// Mock backtest result data
const MOCK_RESULTS = {
  summary: {
    totalReturn: 28.5,
    annualizedReturn: 31.2,
    sharpeRatio: 1.82,
    maxDrawdown: 12.4,
    winRate: 68,
    profitFactor: 2.4,
    totalTrades: 24,
    avgTradeReturn: 1.4,
    avgWinningTrade: 3.8,
    avgLosingTrade: -1.6,
    bestTrade: 8.4,
    worstTrade: -4.2,
  },
  monthlyReturns: [
    { month: 'Jan 23', return: 3.2 },
    { month: 'Feb 23', return: -1.8 },
    { month: 'Mar 23', return: 4.1 },
    { month: 'Apr 23', return: 2.2 },
    { month: 'May 23', return: -2.4 },
    { month: 'Jun 23', return: 3.8 },
    { month: 'Jul 23', return: 2.5 },
    { month: 'Aug 23', return: -3.1 },
    { month: 'Sep 23', return: 5.2 },
    { month: 'Oct 23', return: -1.7 },
    { month: 'Nov 23', return: 6.4 },
    { month: 'Dec 23', return: 8.1 },
  ],
  equityCurve: [
    { date: '2023-01-01', equity: 10000 },
    { date: '2023-02-01', equity: 10320 },
    { date: '2023-03-01', equity: 10134 },
    { date: '2023-04-01', equity: 10549 },
    { date: '2023-05-01', equity: 10781 },
    { date: '2023-06-01', equity: 10523 },
    { date: '2023-07-01', equity: 10923 },
    { date: '2023-08-01', equity: 11196 },
    { date: '2023-09-01', equity: 10849 },
    { date: '2023-10-01', equity: 11413 },
    { date: '2023-11-01', equity: 11219 },
    { date: '2023-12-01', equity: 11937 },
    { date: '2023-12-31', equity: 12850 },
  ],
  trades: [
    { 
      id: 1, 
      ticker: 'SPY', 
      entryDate: '2023-01-15', 
      exitDate: '2023-01-29', 
      entryPrice: 380.42, 
      exitPrice: 391.84, 
      position: 'call', 
      strategy: 'bullish', 
      pnl: 8.4,
      pnlPct: 21.1 
    },
    { 
      id: 2, 
      ticker: 'SPY', 
      entryDate: '2023-02-10', 
      exitDate: '2023-02-18', 
      entryPrice: 410.22, 
      exitPrice: 402.17, 
      position: 'put', 
      strategy: 'bearish', 
      pnl: 4.2,
      pnlPct: 11.2 
    },
    { 
      id: 3, 
      ticker: 'SPY', 
      entryDate: '2023-03-05', 
      exitDate: '2023-03-20', 
      entryPrice: 395.80, 
      exitPrice: 402.34, 
      position: 'call', 
      strategy: 'bullish', 
      pnl: 3.4,
      pnlPct: 8.9 
    },
    { 
      id: 4, 
      ticker: 'SPY', 
      entryDate: '2023-04-10', 
      exitDate: '2023-04-25', 
      entryPrice: 412.54, 
      exitPrice: 408.21, 
      position: 'call', 
      strategy: 'bullish', 
      pnl: -1.9,
      pnlPct: -4.5 
    },
    { 
      id: 5, 
      ticker: 'SPY', 
      entryDate: '2023-05-05', 
      exitDate: '2023-05-20', 
      entryPrice: 411.35, 
      exitPrice: 405.62, 
      position: 'put', 
      strategy: 'bearish', 
      pnl: 3.1,
      pnlPct: 7.8 
    },
  ],
  optimization: [
    { param: 1, return: 18.4, sharpe: 1.24, drawdown: 15.2, winRate: 62 },
    { param: 2, return: 28.5, sharpe: 1.82, drawdown: 12.4, winRate: 68 },
    { param: 3, return: 24.1, sharpe: 1.56, drawdown: 13.8, winRate: 65 },
    { param: 4, return: 19.5, sharpe: 1.32, drawdown: 14.5, winRate: 63 },
    { param: 5, return: 15.8, sharpe: 1.12, drawdown: 16.2, winRate: 60 },
  ],
};

export default function BacktestingPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [results, setResults] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [savedBacktests, setSavedBacktests] = useState<any[]>([]);
  const { toast } = useToast();

  // Load saved backtests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedBacktests');
    if (saved) {
      try {
        setSavedBacktests(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved backtests:', error);
      }
    }
  }, []);
  
  // Helper function to update parameters
  const updateParam = (key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Helper function to update nested parameters
  const updateNestedParam = (parent: string, key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [key]: value,
      },
    }));
  };
  
  // Run backtest with current parameters
  const runBacktest = () => {
    setIsRunning(true);
    toast({
      title: 'Backtest Started',
      description: `Running backtest for ${params.ticker} from ${params.startDate} to ${params.endDate}`,
    });
    
    // Simulate API delay
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setIsRunning(false);
      toast({
        title: 'Backtest Complete',
        description: `Backtest completed successfully with a ${MOCK_RESULTS.summary.totalReturn.toFixed(1)}% return`,
      });
    }, 2500);
  };
  
  // Save current backtest to localStorage
  const saveBacktest = () => {
    if (!results) return;
    
    const backtest = {
      id: Date.now(),
      name: `${params.ticker} - ${params.strategy} - ${new Date().toLocaleDateString()}`,
      params,
      results,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [...savedBacktests, backtest];
    setSavedBacktests(updated);
    localStorage.setItem('savedBacktests', JSON.stringify(updated));
    
    toast({
      title: 'Backtest Saved',
      description: 'Your backtest results have been saved successfully',
    });
  };
  
  // Load a saved backtest
  const loadBacktest = (id: number) => {
    const backtest = savedBacktests.find(b => b.id === id);
    if (backtest) {
      setParams(backtest.params);
      setResults(backtest.results);
      
      toast({
        title: 'Backtest Loaded',
        description: `Loaded backtest: ${backtest.name}`,
      });
    }
  };
  
  // Delete a saved backtest
  const deleteBacktest = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedBacktests.filter(b => b.id !== id);
    setSavedBacktests(updated);
    localStorage.setItem('savedBacktests', JSON.stringify(updated));
    
    toast({
      title: 'Backtest Deleted',
      description: 'The selected backtest has been deleted',
    });
  };
  
  // Reset to default parameters
  const resetParams = () => {
    setParams(DEFAULT_PARAMS);
    toast({
      title: 'Parameters Reset',
      description: 'All parameters have been reset to default values',
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Strategy Backtesting</h1>
        <p className="text-muted-foreground">
          Test and optimize your trading strategies with historical data
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parameters Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Backtest Parameters</CardTitle>
            <CardDescription>Configure your backtest settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                <TabsTrigger value="rules" className="flex-1">Rules</TabsTrigger>
              </TabsList>
              
              {/* Basic Parameters */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    value={params.ticker}
                    onChange={(e) => updateParam('ticker', e.target.value.toUpperCase())}
                    placeholder="e.g. SPY, AAPL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={params.startDate}
                    onChange={(e) => updateParam('startDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={params.endDate}
                    onChange={(e) => updateParam('endDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy</Label>
                  <Select 
                    value={params.strategy} 
                    onValueChange={(value) => updateParam('strategy', value)}
                  >
                    <SelectTrigger id="strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="options-technical-hybrid">Options-Technical Hybrid</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                      <SelectItem value="volatility">Volatility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setup-type">Setup Type</Label>
                  <Select 
                    value={params.setupType} 
                    onValueChange={(value) => updateParam('setupType', value)}
                  >
                    <SelectTrigger id="setup-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Setups</SelectItem>
                      <SelectItem value="bullish">Bullish Only</SelectItem>
                      <SelectItem value="bearish">Bearish Only</SelectItem>
                      <SelectItem value="neutral">Neutral Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              {/* Advanced Parameters */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-capital">Initial Capital ($)</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    value={params.initialCapital}
                    onChange={(e) => updateParam('initialCapital', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      id="risk-per-trade"
                      min={1}
                      max={10}
                      step={0.5}
                      value={[params.riskPerTrade]}
                      onValueChange={(value) => updateParam('riskPerTrade', value[0])}
                    />
                    <span className="w-10 text-right">{params.riskPerTrade}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-positions">Max Concurrent Positions</Label>
                  <Input
                    id="max-positions"
                    type="number"
                    value={params.maxPositions}
                    onChange={(e) => updateParam('maxPositions', parseInt(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exit-strategy">Exit Strategy</Label>
                  <Select 
                    value={params.exitStrategy} 
                    onValueChange={(value) => updateParam('exitStrategy', value)}
                  >
                    <SelectTrigger id="exit-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target-or-stop">Target or Stop</SelectItem>
                      <SelectItem value="fixed-days">Fixed Days</SelectItem>
                      <SelectItem value="trailing-stop">Trailing Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-options">Use Options</Label>
                  <Switch 
                    id="use-options" 
                    checked={params.useOptionsPositions}
                    onCheckedChange={(value) => updateParam('useOptionsPositions', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-stock">Use Stock</Label>
                  <Switch 
                    id="use-stock" 
                    checked={params.useStockPositions}
                    onCheckedChange={(value) => updateParam('useStockPositions', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Per Contract ($)</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={params.commissionPerContract}
                    onChange={(e) => updateParam('commissionPerContract', parseFloat(e.target.value))}
                    step={0.01}
                  />
                </div>
              </TabsContent>
              
              {/* Rules Parameters */}
              <TabsContent value="rules" className="space-y-4 mt-4">
                <div className="space-y-1">
                  <Label>Technical Rules</Label>
                  
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>RSI Oversold Threshold</span>
                      <span>{params.rsiOversold}</span>
                    </div>
                    <Slider
                      min={10}
                      max={40}
                      step={1}
                      value={[params.rsiOversold]}
                      onValueChange={(value) => updateParam('rsiOversold', value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span>RSI Overbought Threshold</span>
                      <span>{params.rsiOverbought}</span>
                    </div>
                    <Slider
                      min={60}
                      max={90}
                      step={1}
                      value={[params.rsiOverbought]}
                      onValueChange={(value) => updateParam('rsiOverbought', value[0])}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <Label>Options Rules</Label>
                  
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Days To Expiration</span>
                      <span>{params.minDaysToExpiration} - {params.maxDaysToExpiration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={params.minDaysToExpiration}
                        onChange={(e) => updateParam('minDaysToExpiration', parseInt(e.target.value))}
                        className="w-16"
                        min={7}
                        max={params.maxDaysToExpiration}
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        value={params.maxDaysToExpiration}
                        onChange={(e) => updateParam('maxDaysToExpiration', parseInt(e.target.value))}
                        className="w-16"
                        min={params.minDaysToExpiration}
                        max={180}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span>Target Delta</span>
                      <span>{params.targetDelta}</span>
                    </div>
                    <Slider
                      min={0.20}
                      max={0.80}
                      step={0.05}
                      value={[params.targetDelta]}
                      onValueChange={(value) => updateParam('targetDelta', value[0])}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <Label htmlFor="use-iv-rank">Use IV Rank Filter</Label>
                    <Switch 
                      id="use-iv-rank" 
                      checked={params.useIvRank}
                      onCheckedChange={(value) => updateParam('useIvRank', value)}
                    />
                  </div>
                  
                  {params.useIvRank && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span>IV Rank Range</span>
                        <span>{params.minIvRank}% - {params.maxIvRank}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={params.minIvRank}
                          onChange={(e) => updateParam('minIvRank', parseInt(e.target.value))}
                          className="w-16"
                          min={0}
                          max={params.maxIvRank}
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          value={params.maxIvRank}
                          onChange={(e) => updateParam('maxIvRank', parseInt(e.target.value))}
                          className="w-16"
                          min={params.minIvRank}
                          max={100}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optimize">Parameter Optimization</Label>
                    <Switch 
                      id="optimize" 
                      checked={params.optimize}
                      onCheckedChange={(value) => updateParam('optimize', value)}
                    />
                  </div>
                  
                  {params.optimize && (
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="optimize-parameter">Parameter to Optimize</Label>
                      <Select 
                        value={params.optimizeParameter} 
                        onValueChange={(value) => updateParam('optimizeParameter', value)}
                      >
                        <SelectTrigger id="optimize-parameter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="riskPerTrade">Risk Per Trade</SelectItem>
                          <SelectItem value="targetDelta">Target Delta</SelectItem>
                          <SelectItem value="rsiOversold">RSI Oversold</SelectItem>
                          <SelectItem value="rsiOverbought">RSI Overbought</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="space-y-1">
                          <Label htmlFor="optimize-start" className="text-xs">Start</Label>
                          <Input
                            id="optimize-start"
                            type="number"
                            value={params.optimizeStart}
                            onChange={(e) => updateParam('optimizeStart', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="optimize-end" className="text-xs">End</Label>
                          <Input
                            id="optimize-end"
                            type="number"
                            value={params.optimizeEnd}
                            onChange={(e) => updateParam('optimizeEnd', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="optimize-steps" className="text-xs">Steps</Label>
                          <Input
                            id="optimize-steps"
                            type="number"
                            value={params.optimizeSteps}
                            onChange={(e) => updateParam('optimizeSteps', parseInt(e.target.value))}
                            className="w-full"
                            min={2}
                            max={10}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {savedBacktests.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm mb-2">Saved Backtests</Label>
                <div className="space-y-1 max-h-40 overflow-auto pr-1">
                  {savedBacktests.map((backtest) => (
                    <div
                      key={backtest.id}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-accent flex justify-between items-center"
                      onClick={() => loadBacktest(backtest.id)}
                    >
                      <div className="flex-1 truncate">
                        <span className="font-medium">{backtest.name}</span>
                        <div className="text-muted-foreground text-[10px]">
                          {new Date(backtest.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteBacktest(backtest.id, e)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete backtest"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetParams}>
              Reset
            </Button>
            <Button onClick={runBacktest} disabled={isRunning}>
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Results Panel */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Backtest Results</CardTitle>
                <CardDescription>
                  {results ? `${params.ticker} (${params.startDate} to ${params.endDate})` : 'Configure parameters and run a backtest'}
                </CardDescription>
              </div>
              {results && (
                <Button variant="outline" size="sm" onClick={saveBacktest}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Running Backtest</p>
                <p className="text-sm text-muted-foreground">
                  This may take a moment depending on the date range and parameters...
                </p>
              </div>
            ) : !results ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Backtest Results Yet</p>
                <p className="text-sm text-muted-foreground">
                  Configure your parameters and run a backtest to see results
                </p>
              </div>
            ) : (
              <Tabs defaultValue="summary">
                <TabsList className="w-full">
                  <TabsTrigger value="summary" className="flex items-center">
                    <BarChart className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="trades" className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Trades
                  </TabsTrigger>
                  {params.optimize && (
                    <TabsTrigger value="optimization" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Optimization
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {/* Summary Tab */}
                <TabsContent value="summary" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {results.summary.totalReturn.toFixed(1)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Total Return</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {results.summary.sharpeRatio.toFixed(2)}
                          </div>
                          <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">
                            {results.summary.maxDrawdown.toFixed(1)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Max Drawdown</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {results.summary.winRate}%
                          </div>
                          <p className="text-sm text-muted-foreground">Win Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Annualized Return:</span>
                            <span className="font-medium">{results.summary.annualizedReturn.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Profit Factor:</span>
                            <span className="font-medium">{results.summary.profitFactor.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Trades:</span>
                            <span className="font-medium">{results.summary.totalTrades}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Trade:</span>
                            <span className="font-medium">{results.summary.avgTradeReturn.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Winner:</span>
                            <span className="font-medium text-green-500">+{results.summary.avgWinningTrade.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Loser:</span>
                            <span className="font-medium text-red-500">{results.summary.avgLosingTrade.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Best Trade:</span>
                            <span className="font-medium text-green-500">+{results.summary.bestTrade.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Worst Trade:</span>
                            <span className="font-medium text-red-500">{results.summary.worstTrade.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Monthly Returns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                          {results.monthlyReturns.map((month: any, i: number) => (
                            <div key={i} className="text-xs border rounded-md p-2">
                              <div className="font-medium">{month.month}</div>
                              <div className={month.return >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {month.return >= 0 ? '+' : ''}{month.return.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Performance Tab */}
                <TabsContent value="performance" className="mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Equity Curve</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <LineChart className="h-10 w-10 mx-auto mb-2" />
                          <p>Equity curve chart would be displayed here</p>
                          <p className="text-xs mt-1">Starting: ${results.equityCurve[0].equity} / Current: ${results.equityCurve[results.equityCurve.length - 1].equity}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Drawdown Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="h-60 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <PieChart className="h-10 w-10 mx-auto mb-2" />
                            <p>Drawdown analysis would be displayed here</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Win/Loss Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-60 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <BarChart className="h-10 w-10 mx-auto mb-2" />
                            <p>Win/loss distribution would be displayed here</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Trades Tab */}
                <TabsContent value="trades" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Trade History</CardTitle>
                      <CardDescription>
                        Showing {results.trades.length} of {results.summary.totalTrades} trades
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Ticker</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Entry Date
                                </div>
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Exit Date
                                </div>
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                <div className="flex items-center">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Position
                                </div>
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                P&L
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                P&L %
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {results.trades.map((trade: any) => (
                              <tr key={trade.id} className="hover:bg-muted/50">
                                <td className="px-4 py-2 text-sm">{trade.id}</td>
                                <td className="px-4 py-2 text-sm font-medium">{trade.ticker}</td>
                                <td className="px-4 py-2 text-sm">{trade.entryDate}</td>
                                <td className="px-4 py-2 text-sm">{trade.exitDate}</td>
                                <td className="px-4 py-2 text-sm">
                                  <Badge variant="outline" className={
                                    trade.position === 'call' 
                                      ? 'text-green-500 border-green-200' 
                                      : 'text-red-500 border-red-200'
                                  }>
                                    {trade.position}
                                  </Badge>
                                </td>
                                <td className={`px-4 py-2 text-sm text-right ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                </td>
                                <td className={`px-4 py-2 text-sm text-right ${trade.pnlPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct.toFixed(2)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Optimization Tab */}
                {params.optimize && (
                  <TabsContent value="optimization" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Parameter Optimization</CardTitle>
                        <CardDescription>
                          Optimizing {params.optimizeParameter} from {params.optimizeStart} to {params.optimizeEnd}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Parameter Value</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total Return (%)</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Sharpe Ratio</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Max Drawdown (%)</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Win Rate (%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {results.optimization.map((opt: any, i: number) => (
                                <tr 
                                  key={i} 
                                  className={
                                    opt.sharpe === Math.max(...results.optimization.map((o: any) => o.sharpe))
                                      ? 'bg-primary/10 hover:bg-primary/20'
                                      : 'hover:bg-muted/50'
                                  }
                                >
                                  <td className="px-4 py-2 text-sm font-medium">{opt.param}</td>
                                  <td className="px-4 py-2 text-sm text-right">{opt.return.toFixed(1)}</td>
                                  <td className="px-4 py-2 text-sm text-right font-medium">{opt.sharpe.toFixed(2)}</td>
                                  <td className="px-4 py-2 text-sm text-right text-red-500">{opt.drawdown.toFixed(1)}</td>
                                  <td className="px-4 py-2 text-sm text-right">{opt.winRate}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                          <div className="bg-primary/10 border border-primary/20 rounded-md px-4 py-3 text-sm inline-flex items-start max-w-md">
                            <span className="text-primary mr-2">💡</span>
                            <span>
                              <strong>Optimization insight:</strong> The best {params.optimizeParameter} value appears to be{' '}
                              <strong>{results.optimization.reduce((a: any, b: any) => a.sharpe > b.sharpe ? a : b).param}</strong>
                              {' '}with a Sharpe ratio of{' '}
                              <strong>{Math.max(...results.optimization.map((o: any) => o.sharpe)).toFixed(2)}</strong>.
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}