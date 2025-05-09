"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, ArrowUpRight, ArrowDownRight, MinusCircle } from 'lucide-react';

interface TradeSetup {
  ticker: string;
  date: string;
  timestamp: number;
  setup_type: string;
  strength: number;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  risk_reward_ratio: number;
}

interface ScannerResult {
  [ticker: string]: TradeSetup | null;
}

export function ScannerDashboard() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [setupType, setSetupType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ScannerResult>({});
  const { toast } = useToast();
  
  // Initialize data collection when component mounts
  useEffect(() => {
    // Initialize data collection
    fetch('/api/init')
      .then(res => res.json())
      .then(data => {
        console.log('Data collection initialized:', data);
      })
      .catch(error => {
        console.error('Failed to initialize data collection:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize data collection',
          variant: 'destructive',
        });
      });
      
    // Fetch available tickers
    fetchTickers();
  }, []);
  
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
  
  // Run the scanner
  const runScanner = async () => {
    setIsLoading(true);
    
    try {
      let url = '/api/scanner';
      
      if (selectedTicker && selectedTicker !== 'all') {
        url += `?ticker=${selectedTicker}&force=true`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (selectedTicker && selectedTicker !== 'all') {
        // Single ticker scan
        setResults({ [selectedTicker]: data.setup });
      } else {
        // All tickers scan
        setResults(data.results);
      }
      
      toast({
        title: 'Scan Complete',
        description: 'Scanner analysis completed successfully',
      });
    } catch (error) {
      console.error('Scanner error:', error);
      toast({
        title: 'Error',
        description: 'Failed to run scanner',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get setup color and icon
  const getSetupProperties = (type: string) => {
    switch (type) {
      case 'bullish':
        return { 
          color: 'bg-green-500', 
          textColor: 'text-green-500', 
          icon: <ArrowUpRight className="h-5 w-5" /> 
        };
      case 'bearish':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-500', 
          icon: <ArrowDownRight className="h-5 w-5" /> 
        };
      case 'neutral':
        return { 
          color: 'bg-yellow-500', 
          textColor: 'text-yellow-500', 
          icon: <MinusCircle className="h-5 w-5" /> 
        };
      default:
        return { 
          color: 'bg-gray-500', 
          textColor: 'text-gray-500', 
          icon: null 
        };
    }
  };
  
  // Filter results based on selected setup type
  const filteredResults = () => {
    if (setupType === 'all') {
      return results;
    }
    
    return Object.entries(results).reduce((filtered, [ticker, setup]) => {
      if (setup && setup.setup_type === setupType) {
        filtered[ticker] = setup;
      }
      return filtered;
    }, {} as ScannerResult);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Options-Technical Hybrid Scanner</CardTitle>
          <CardDescription>
            Scan for trading opportunities using options and technical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-1">Ticker</label>
              <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickers</SelectItem>
                  {tickers.map(ticker => (
                    <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-1">Setup Type</label>
              <Select value={setupType} onValueChange={setSetupType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select setup type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Setups</SelectItem>
                  <SelectItem value="bullish">Bullish</SelectItem>
                  <SelectItem value="bearish">Bearish</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={runScanner} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Scanner
                </>
              )}
            </Button>
          </div>
          
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(filteredResults()).map(([ticker, setup]) => (
                  <Card key={ticker} className={`overflow-hidden ${setup ? 'border-l-4 ' + getSetupProperties(setup.setup_type).color : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{ticker}</CardTitle>
                        {setup && (
                          <Badge variant="outline" className={getSetupProperties(setup.setup_type).textColor}>
                            {getSetupProperties(setup.setup_type).icon}
                            <span className="ml-1 capitalize">{setup.setup_type}</span>
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {setup ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Entry:</span>
                            <span className="font-medium">${setup.entry_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-medium">${setup.target_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stop Loss:</span>
                            <span className="font-medium">${setup.stop_loss.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Risk/Reward:</span>
                            <span className="font-medium">{setup.risk_reward_ratio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Strength:</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div 
                                className={`h-2.5 rounded-full ${getSetupProperties(setup.setup_type).color}`}
                                style={{ width: `${setup.strength}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">
                          No setup detected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {Object.keys(filteredResults()).length === 0 && (
                  <div className="col-span-3 py-12 text-center text-muted-foreground">
                    No results found. Try running the scanner or selecting a different setup type.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticker</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Setup</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stop Loss</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">R/R</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Strength</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {Object.entries(filteredResults()).map(([ticker, setup]) => (
                      <tr key={ticker}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ticker}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? (
                            <Badge variant="outline" className={getSetupProperties(setup.setup_type).textColor}>
                              {getSetupProperties(setup.setup_type).icon}
                              <span className="ml-1 capitalize">{setup.setup_type}</span>
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? `$${setup.entry_price.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? `$${setup.target_price.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? `$${setup.stop_loss.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? setup.risk_reward_ratio.toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {setup ? (
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div 
                                className={`h-2.5 rounded-full ${getSetupProperties(setup.setup_type).color}`}
                                style={{ width: `${setup.strength}%` }}
                              ></div>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                    
                    {Object.keys(filteredResults()).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                          No results found. Try running the scanner or selecting a different setup type.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
