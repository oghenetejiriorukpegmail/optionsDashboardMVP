"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { fetchOptionsChain, fetchScannerResults } from "@/lib/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Loader2, Target, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { TickerSelector } from "../ui/ticker-selector";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface KeyLevelsMappingProps {
  symbol?: string;
  ticker?: string; // Alternative prop name
  currentPrice?: number;
  keyLevels?: {
    support: number[];
    resistance: number[];
    maxPain: number;
  };
}

interface OptionsChainData {
  expiration: string;
  strikes: StrikeData[];
}

interface StrikeData {
  strike: number;
  callOpenInterest: number;
  putOpenInterest: number;
  callVolume: number;
  putVolume: number;
  gamma?: number;
  vanna?: number;
  charm?: number;
  vomma?: number;
}

export function KeyLevelsMapping({ symbol: propSymbol, ticker: propTicker, currentPrice: propPrice, keyLevels: propKeyLevels }: KeyLevelsMappingProps) {
  const [selectedTicker, setSelectedTicker] = useState(propSymbol || propTicker || '');
  const symbol = selectedTicker || propSymbol || propTicker || 'AAPL';
  const [optionsData, setOptionsData] = useState<OptionsChainData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expirationDates, setExpirationDates] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number>(propPrice || 0);
  const [keyLevels, setKeyLevels] = useState(propKeyLevels || {
    support: [],
    resistance: [],
    maxPain: 0
  });

  // Fetch ticker data when ticker changes
  useEffect(() => {
    if (selectedTicker) {
      fetchTickerData();
    }
  }, [selectedTicker]);

  const fetchTickerData = async () => {
    try {
      // Use ticker-context API for comprehensive key levels data
      const response = await fetch(`/api/ticker-context?symbol=${symbol}`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      
      const data = await response.json();
      if (data) {
        setCurrentPrice(data.price || 0);
        setKeyLevels({
          support: data.keyLevels?.support || [],
          resistance: data.keyLevels?.resistance || [],
          maxPain: data.keyLevels?.maxPain || data.price || 0
        });
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      // Set error state if no data available
      setCurrentPrice(0);
      setKeyLevels({
        support: [],
        resistance: [],
        maxPain: 0
      });
    }
  };

  useEffect(() => {
    async function loadOptionsData() {
      setLoading(true);
      try {
        // Use the options-data API that has seeded data
        const optionsResponse = await fetch(`/api/options-data?ticker=${symbol}`);
        if (!optionsResponse.ok) throw new Error(`Options API returned ${optionsResponse.status}`);
        
        const optionsData = await optionsResponse.json();
        
        if (optionsData && optionsData.optionsData && optionsData.optionsData.length > 0) {
          // Get unique expiration dates from the options data
          const expirations = [...new Set(optionsData.optionsData.map((opt: any) => opt.expiration_date))] as string[];
          setExpirationDates(expirations);
          
          // Use the first available expiration
          const initialExpiration = expirations[0];
          setSelectedExpiration(initialExpiration);
          
          // Transform the options data to match component expectations
          const transformedData = transformOptionsDataToChainFormat(optionsData.optionsData, initialExpiration);
          setOptionsData(transformedData);
        }
      } catch (error) {
        console.error("Error fetching options chain:", error);
        // Set error state if no data available
        setOptionsData(null);
        setExpirationDates([]);
        setSelectedExpiration("");
      } finally {
        setLoading(false);
      }
    }

    if (symbol) {
      loadOptionsData();
    }
  }, [symbol, currentPrice]);


  // Transform options data from database format to component format
  const transformOptionsDataToChainFormat = (optionsData: any[], expiration: string): OptionsChainData => {
    if (!optionsData || optionsData.length === 0) {
      return { expiration: '', strikes: [] };
    }

    // Filter data for the specific expiration
    const expirationData = optionsData.filter((opt: any) => opt.expiration_date === expiration);
    
    if (expirationData.length === 0) {
      return { expiration, strikes: [] };
    }

    // Get all unique strikes
    const strikes = [...new Set(expirationData.map((opt: any) => opt.strike_price))].sort((a, b) => a - b);
    
    // Create strike data by combining call and put data for each strike
    const strikeData: StrikeData[] = strikes.map(strike => {
      const strikeOptions = expirationData.filter((opt: any) => opt.strike_price === strike);
      const sampleOpt = strikeOptions[0]; // Use first option for the strike to get common data
      
      return {
        strike,
        callOpenInterest: sampleOpt?.call_oi || 0,
        putOpenInterest: sampleOpt?.put_oi || 0,
        callVolume: sampleOpt?.call_volume || 0,
        putVolume: sampleOpt?.put_volume || 0,
        gamma: sampleOpt?.call_gamma || sampleOpt?.put_gamma || 0,
        vanna: sampleOpt?.vanna || 0,
        charm: sampleOpt?.charm || 0,
        vomma: sampleOpt?.vomma || 0,
      };
    });

    return {
      expiration,
      strikes: strikeData
    };
  };

  // Legacy transform function (keeping for backwards compatibility)
  const transformOptionsChainData = (apiData: any): OptionsChainData => {
    if (!apiData || (!apiData.calls && !apiData.puts)) {
      return { expiration: '', strikes: [] };
    }

    // Get all unique strikes from both calls and puts
    const allStrikes = new Set<number>();
    
    if (apiData.calls) {
      apiData.calls.forEach((call: any) => allStrikes.add(call.strike));
    }
    
    if (apiData.puts) {
      apiData.puts.forEach((put: any) => allStrikes.add(put.strike));
    }

    const strikes = Array.from(allStrikes).sort((a, b) => a - b);
    
    // Create strike data by combining calls and puts for each strike
    const strikeData: StrikeData[] = strikes.map(strike => {
      const call = apiData.calls?.find((c: any) => c.strike === strike);
      const put = apiData.puts?.find((p: any) => p.strike === strike);
      
      return {
        strike,
        callOpenInterest: call?.openInterest || 0,
        putOpenInterest: put?.openInterest || 0,
        callVolume: call?.volume || 0,
        putVolume: put?.volume || 0,
        gamma: call?.gamma || put?.gamma || 0,
        vanna: call?.vanna || put?.vanna || 0,
        charm: call?.charm || put?.charm || 0,
        vomma: call?.vomma || put?.vomma || 0,
      };
    });

    return {
      expiration: apiData.expiration || '',
      strikes: strikeData
    };
  };

  const handleExpirationChange = async (newExpiration: string) => {
    setSelectedExpiration(newExpiration);
    setLoading(true);
    
    try {
      // Use the options-data API that has seeded data
      const optionsResponse = await fetch(`/api/options-data?ticker=${symbol}`);
      if (!optionsResponse.ok) throw new Error(`Options API returned ${optionsResponse.status}`);
      
      const optionsData = await optionsResponse.json();
      
      if (optionsData && optionsData.optionsData && optionsData.optionsData.length > 0) {
        // Transform the options data for the new expiration
        const transformedData = transformOptionsDataToChainFormat(optionsData.optionsData, newExpiration);
        setOptionsData(transformedData);
      } else {
        setOptionsData(null);
      }
    } catch (error) {
      console.error("Error fetching options chain:", error);
      // Set error state if no data available
      setOptionsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics
  const calculateOpenInterestPCR = () => {
    if (!optionsData || !optionsData.strikes) return 0;
    
    const totalPutOI = optionsData.strikes.reduce((sum, strike) => sum + strike.putOpenInterest, 0);
    const totalCallOI = optionsData.strikes.reduce((sum, strike) => sum + strike.callOpenInterest, 0);
    
    return totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
  };

  const calculateVolumePCR = () => {
    if (!optionsData || !optionsData.strikes) return 0;
    
    const totalPutVolume = optionsData.strikes.reduce((sum, strike) => sum + strike.putVolume, 0);
    const totalCallVolume = optionsData.strikes.reduce((sum, strike) => sum + strike.callVolume, 0);
    
    return totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;
  };

  const findMaxPainStrike = () => {
    if (!optionsData || !optionsData.strikes) return keyLevels.maxPain;
    
    let maxPainStrike = 0;
    let minTotalValue = Infinity;
    
    optionsData.strikes.forEach(strikeData => {
      let totalValue = 0;
      
      // Calculate pain for this strike
      optionsData.strikes.forEach(otherStrike => {
        // Call holders pain
        if (otherStrike.strike < strikeData.strike) {
          totalValue += (strikeData.strike - otherStrike.strike) * otherStrike.callOpenInterest * 100;
        }
        
        // Put holders pain
        if (otherStrike.strike > strikeData.strike) {
          totalValue += (otherStrike.strike - strikeData.strike) * otherStrike.putOpenInterest * 100;
        }
      });
      
      if (totalValue < minTotalValue) {
        minTotalValue = totalValue;
        maxPainStrike = strikeData.strike;
      }
    });
    
    return maxPainStrike;
  };

  const identifyKeyStrikes = () => {
    if (!optionsData || !optionsData.strikes) return { highOIStrikes: [], highGammaStrikes: [] };
    
    // Sort by total open interest
    const sortedByOI = [...optionsData.strikes].sort((a, b) => 
      (b.callOpenInterest + b.putOpenInterest) - (a.callOpenInterest + a.putOpenInterest)
    );
    
    // Get top 5 high OI strikes
    const highOIStrikes = sortedByOI.slice(0, 5).map(s => s.strike);
    
    // Sort by gamma (if available)
    const strikesWithGamma = optionsData.strikes.filter(s => s.gamma && s.gamma > 0);
    const sortedByGamma = [...strikesWithGamma].sort((a, b) => (b.gamma || 0) - (a.gamma || 0));
    const highGammaStrikes = sortedByGamma.slice(0, 3).map(s => s.strike);
    
    return { highOIStrikes, highGammaStrikes };
  };

  const { highOIStrikes, highGammaStrikes } = identifyKeyStrikes();
  const calculatedMaxPain = findMaxPainStrike();
  const oiPCR = calculateOpenInterestPCR();
  const volumePCR = calculateVolumePCR();

  // Prepare chart data
  const prepareChartData = () => {
    if (!optionsData || !optionsData.strikes || optionsData.strikes.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Call Open Interest',
            data: [0],
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
          {
            label: 'Put Open Interest',
            data: [0],
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: optionsData.strikes.map(s => s.strike.toString()),
      datasets: [
        {
          label: 'Call Open Interest',
          data: optionsData.strikes.map(s => s.callOpenInterest || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Put Open Interest',
          data: optionsData.strikes.map(s => -(s.putOpenInterest || 0)),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Open Interest by Strike',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = Math.abs(context.parsed.y);
            const type = context.dataset.label;
            return `${type}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return Math.abs(value).toLocaleString();
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedTicker && !propSymbol && !propTicker) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <TickerSelector 
            value={selectedTicker}
            onValueChange={setSelectedTicker}
            placeholder="Select ticker..."
          />
          <p className="text-muted-foreground">Select a ticker to view key levels analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <TickerSelector 
          value={selectedTicker}
          onValueChange={setSelectedTicker}
          placeholder="Select ticker..."
        />
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            {symbol} Key Levels
            <Badge variant="outline" className="text-lg">
              ${currentPrice.toFixed(2)}
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            Options-based support and resistance levels
          </p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Pain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculatedMaxPain.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((calculatedMaxPain - currentPrice) / currentPrice * 100).toFixed(2)}% from current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OI Put/Call Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oiPCR.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {oiPCR > 1.2 ? 'Bearish' : oiPCR < 0.8 ? 'Bullish' : 'Neutral'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume PCR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumePCR.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {volumePCR > 1.2 ? 'Bearish' : volumePCR < 0.8 ? 'Bullish' : 'Neutral'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days to Expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedExpiration ? 
                Math.ceil((new Date(selectedExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedExpiration}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Expiration Date</CardTitle>
          <CardDescription>Select an expiration to view options data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedExpiration} onValueChange={handleExpirationChange}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              {expirationDates.slice(0, 3).map(exp => (
                <TabsTrigger key={exp} value={exp}>
                  {new Date(exp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Levels Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Identified Key Levels
          </CardTitle>
          <CardDescription>
            Support and resistance based on options positioning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Technical Levels */}
          <div>
            <h4 className="font-semibold mb-2">Technical Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Support Levels</div>
                <div className="space-y-1">
                  {keyLevels.support.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                      <span className="text-sm font-medium">${level.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        {((level - currentPrice) / currentPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Resistance Levels</div>
                <div className="space-y-1">
                  {keyLevels.resistance.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                      <span className="text-sm font-medium">${level.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        {((level - currentPrice) / currentPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Options-Based Levels */}
          <div>
            <h4 className="font-semibold mb-2">Options-Based Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">High OI Strikes</div>
                <div className="space-y-1">
                  {highOIStrikes.slice(0, 3).map((strike, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <span className="text-sm font-medium">${strike}</span>
                      <Badge variant="outline" className="text-xs">
                        {strike > currentPrice ? 'R' : strike < currentPrice ? 'S' : 'ATM'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">High Gamma Strikes</div>
                <div className="space-y-1">
                  {highGammaStrikes.length > 0 ? highGammaStrikes.map((strike, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950 rounded">
                      <span className="text-sm font-medium">${strike}</span>
                      <Badge variant="outline" className="text-xs">
                        Γ
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground">No gamma data</div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Max Pain</div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">${calculatedMaxPain.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">
                      MP
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Price magnet at expiry
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Interest Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Open Interest Distribution</CardTitle>
          <CardDescription>
            Call and put open interest by strike price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm">Key Observations</span>
            </div>
            {optionsData && optionsData.strikes && optionsData.strikes.length > 0 ? (
              <ul className="text-sm space-y-1">
                <li>• Highest call OI at ${highOIStrikes[0] || 'N/A'} (potential resistance)</li>
                <li>• Highest put OI provides support levels</li>
                <li>• Max pain at ${calculatedMaxPain.toFixed(2)} suggests price target</li>
                <li>• PCR of {oiPCR.toFixed(2)} indicates {oiPCR > 1.2 ? 'bearish' : oiPCR < 0.8 ? 'bullish' : 'neutral'} sentiment</li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No options data available. This could be due to:
                <br />• Market is closed
                <br />• No options trading for this symbol
                <br />• Data provider connectivity issues
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}