"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { fetchOptionsChain } from "@/lib/api";
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
  symbol: string;
  currentPrice: number;
  keyLevels: {
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

export function KeyLevelsMapping({ symbol, currentPrice, keyLevels }: KeyLevelsMappingProps) {
  const [optionsData, setOptionsData] = useState<OptionsChainData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expirationDates, setExpirationDates] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");

  useEffect(() => {
    async function loadOptionsData() {
      setLoading(true);
      try {
        const data = await fetchOptionsChain(symbol);
        
        if (data && data.expirations && data.expirations.length > 0) {
          setExpirationDates(data.expirations);
          
          // Select the closest monthly expiration (3rd Friday)
          const thirdFridays = data.expirations.filter((exp: string) => {
            const expDate = new Date(exp);
            const dayOfWeek = expDate.getDay();
            const dayOfMonth = expDate.getDate();
            
            // If it's Friday (5) and between the 15th and 21st of the month
            return dayOfWeek === 5 && dayOfMonth >= 15 && dayOfMonth <= 21;
          });
          
          const initialExpiration = thirdFridays.length > 0 ? 
            thirdFridays[0] : data.expirations[0];
            
          setSelectedExpiration(initialExpiration);
          
          // Fetch options chain for selected expiration
          const optionsChain = await fetchOptionsChain(symbol, initialExpiration);
          setOptionsData(optionsChain);
        }
      } catch (error) {
        console.error("Error fetching options chain:", error);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) {
      loadOptionsData();
    }
  }, [symbol]);

  // When expiration selection changes
  const handleExpirationChange = async (expiration: string) => {
    setLoading(true);
    setSelectedExpiration(expiration);
    
    try {
      const data = await fetchOptionsChain(symbol, expiration);
      setOptionsData(data);
    } catch (error) {
      console.error("Error fetching options chain:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Key Levels Mapping</CardTitle>
          <CardDescription>Loading options data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!optionsData || !optionsData.strikes || optionsData.strikes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Key Levels Mapping</CardTitle>
          <CardDescription>No options data available for {symbol}.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare options data for visualization
  const strikes = optionsData.strikes.map(strike => strike.strike);
  const callOI = optionsData.strikes.map(strike => strike.callOpenInterest);
  const putOI = optionsData.strikes.map(strike => strike.putOpenInterest);
  const callVolume = optionsData.strikes.map(strike => strike.callVolume);
  const putVolume = optionsData.strikes.map(strike => strike.putVolume);
  
  // Calculate max OI for visualization
  const maxCallOI = Math.max(...callOI);
  const maxPutOI = Math.max(...putOI);
  const maxOI = Math.max(maxCallOI, maxPutOI);
  
  // Find potential gamma/charm/vanna values (if available)
  const gammaValues = optionsData.strikes.map(strike => strike.gamma || 0);
  const vannaValues = optionsData.strikes.map(strike => strike.vanna || 0);
  const charmValues = optionsData.strikes.map(strike => strike.charm || 0);
  
  // Filter strikes to focus on relevant price range (±10% of current price)
  const priceRange = currentPrice * 0.1;
  const filteredIndices = optionsData.strikes
    .map((strike, index) => ({strike: strike.strike, index}))
    .filter(item => Math.abs(item.strike - currentPrice) <= priceRange)
    .map(item => item.index);
  
  const relevantStrikes = filteredIndices.map(i => strikes[i]);
  const relevantCallOI = filteredIndices.map(i => callOI[i]);
  const relevantPutOI = filteredIndices.map(i => putOI[i]);
  
  // Open Interest Chart configuration
  const openInterestData = {
    labels: relevantStrikes.map(strike => strike.toFixed(0)),
    datasets: [
      {
        label: 'Call Open Interest',
        data: relevantCallOI,
        backgroundColor: 'rgba(0, 200, 83, 0.7)',
        borderWidth: 1,
      },
      {
        label: 'Put Open Interest',
        data: relevantPutOI,
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderWidth: 1,
      },
    ],
  };
  
  // Create a dataset for volume visualization
  const volumeData = {
    labels: relevantStrikes.map(strike => strike.toFixed(0)),
    datasets: [
      {
        label: 'Call Volume',
        data: filteredIndices.map(i => callVolume[i]),
        backgroundColor: 'rgba(0, 200, 83, 0.7)',
        borderWidth: 1,
      },
      {
        label: 'Put Volume',
        data: filteredIndices.map(i => putVolume[i]),
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart configuration for options data
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Options Open Interest by Strike',
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return `Strike Price: $${context[0].label}`;
          },
          label: function(context: any) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            return `${datasetLabel}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Strike Price',
        },
        grid: {
          display: false,
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Open Interest',
        },
      },
    },
    annotation: {
      annotations: [
        {
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: relevantStrikes.findIndex(strike => strike >= currentPrice),
          borderColor: 'rgba(33, 150, 243, 0.7)',
          borderWidth: 2,
          label: {
            content: `Current Price: $${currentPrice.toFixed(2)}`,
            enabled: true,
            position: 'top',
          }
        },
        {
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: relevantStrikes.findIndex(strike => strike >= keyLevels.maxPain),
          borderColor: 'rgba(156, 39, 176, 0.7)',
          borderWidth: 2,
          label: {
            content: `Max Pain: $${keyLevels.maxPain.toFixed(2)}`,
            enabled: true,
            position: 'bottom',
          }
        }
      ]
    }
  };

  // Identify key price levels based on options data
  const highestCallOIStrike = strikes[callOI.indexOf(maxCallOI)];
  const highestPutOIStrike = strikes[putOI.indexOf(maxPutOI)];
  
  // Calculate gamma pinning zones (strikes with gamma > 0.05)
  const gammaPinningZones = optionsData.strikes
    .filter(strike => (strike.gamma || 0) > 0.05)
    .map(strike => strike.strike);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Key Levels Mapping for {symbol}</CardTitle>
        <CardDescription>
          Options chain analysis to identify support, resistance, and key price levels
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium">Expiration:</span>
          <select 
            value={selectedExpiration}
            onChange={(e) => handleExpirationChange(e.target.value)}
            className="rounded-md border-gray-300 text-sm py-1 px-2"
          >
            {expirationDates.map((exp) => (
              <option key={exp} value={exp}>
                {new Date(exp).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="openInterest">Open Interest</TabsTrigger>
            <TabsTrigger value="greeks">Greeks Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Current Position</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm font-medium">Current Price:</div>
                  <div className="text-sm">${currentPrice.toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Max Pain:</div>
                  <div className="text-sm">${keyLevels.maxPain.toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Nearest Support:</div>
                  <div className="text-sm">${findNearestLevel(currentPrice, keyLevels.support, 'below').toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Nearest Resistance:</div>
                  <div className="text-sm">${findNearestLevel(currentPrice, keyLevels.resistance, 'above').toFixed(2)}</div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Options Activity</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm font-medium">Highest Call OI:</div>
                  <div className="text-sm">${highestCallOIStrike.toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Highest Put OI:</div>
                  <div className="text-sm">${highestPutOIStrike.toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Call/Put OI Ratio:</div>
                  <div className="text-sm">
                    {(callOI.reduce((sum, oi) => sum + oi, 0) / putOI.reduce((sum, oi) => sum + oi, 0)).toFixed(2)}
                  </div>
                  
                  <div className="text-sm font-medium">Gamma Exposure:</div>
                  <div className={`text-sm ${
                    sumGammaExposure(optionsData.strikes) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGEX(sumGammaExposure(optionsData.strikes))}
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Price Magnets</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Max Pain: </span>
                    <span className={`${
                      Math.abs(currentPrice - keyLevels.maxPain) < currentPrice * 0.02 
                        ? 'text-blue-600 font-semibold' : ''
                    }`}>
                      ${keyLevels.maxPain.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({Math.abs(((keyLevels.maxPain / currentPrice) - 1) * 100).toFixed(1)}% from current)
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Gamma Pinning Zones: </span>
                    {gammaPinningZones.length > 0 ? 
                      gammaPinningZones.slice(0, 3).map(strike => 
                        <span key={strike} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs mx-1">
                          ${strike.toFixed(0)}
                        </span>
                      ) : 
                      <span className="text-muted-foreground">None detected</span>
                    }
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">High Vanna Strikes: </span>
                    {findHighVannaStrikes(optionsData.strikes).length > 0 ? 
                      findHighVannaStrikes(optionsData.strikes).slice(0, 3).map(strike => 
                        <span key={strike} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs mx-1">
                          ${strike.toFixed(0)}
                        </span>
                      ) : 
                      <span className="text-muted-foreground">None detected</span>
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 h-80">
              <Bar data={openInterestData} options={chartOptions} />
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Key Level Analysis</h3>
              <p className="text-sm mb-3">
                Based on options chain analysis, the following key levels are identified:
              </p>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="text-sm">
                    <span className="font-medium">Strong Support:</span><br />
                    <span className="text-green-600">${keyLevels.support[0].toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Minor Support:</span><br />
                    <span className="text-green-500">${keyLevels.support[1].toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Minor Resistance:</span><br />
                    <span className="text-red-500">${keyLevels.resistance[0].toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Strong Resistance:</span><br />
                    <span className="text-red-600">${keyLevels.resistance[1].toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-sm mt-3">
                  <span className="font-medium">Expiration Behavior:</span><br />
                  <span className="text-muted-foreground">
                    As expiration approaches, price tends to be drawn to Max Pain at ${keyLevels.maxPain.toFixed(2)}.
                    {Math.abs(currentPrice - keyLevels.maxPain) > currentPrice * 0.05 ? 
                      ` Current price shows a significant (${Math.abs(((keyLevels.maxPain / currentPrice) - 1) * 100).toFixed(1)}%) deviation from Max Pain.` : 
                      ` Current price is within 5% of Max Pain, suggesting potential consolidation near this level into expiration.`
                    }
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="openInterest" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 h-80">
              <Bar data={openInterestData} options={chartOptions} />
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 h-80 mt-4">
              <Bar data={volumeData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: true,
                    text: 'Options Volume by Strike',
                  },
                },
                scales: {
                  ...chartOptions.scales,
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Volume',
                    },
                  },
                }
              }} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Call Open Interest</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-x-2 mb-3">
                    <div className="text-sm font-medium">Total Call OI:</div>
                    <div className="text-sm">{callOI.reduce((sum, oi) => sum + oi, 0).toLocaleString()}</div>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-1">Top 5 Call OI Strikes:</h4>
                  <div className="space-y-1">
                    {getTopStrikes(strikes, callOI, 5).map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-x-2 text-sm">
                        <div>${item.strike.toFixed(2)}</div>
                        <div>{item.value.toLocaleString()}</div>
                        <div className={`${
                          item.strike > currentPrice ? 'text-green-500' : 
                          item.strike < currentPrice ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {item.strike > currentPrice ? 'Resistance' : 
                           item.strike < currentPrice ? 'Support' : 'Current Price'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Put Open Interest</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-x-2 mb-3">
                    <div className="text-sm font-medium">Total Put OI:</div>
                    <div className="text-sm">{putOI.reduce((sum, oi) => sum + oi, 0).toLocaleString()}</div>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-1">Top 5 Put OI Strikes:</h4>
                  <div className="space-y-1">
                    {getTopStrikes(strikes, putOI, 5).map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-x-2 text-sm">
                        <div>${item.strike.toFixed(2)}</div>
                        <div>{item.value.toLocaleString()}</div>
                        <div className={`${
                          item.strike > currentPrice ? 'text-green-500' : 
                          item.strike < currentPrice ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {item.strike > currentPrice ? 'Resistance' : 
                           item.strike < currentPrice ? 'Support' : 'Current Price'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="greeks" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Gamma Analysis</h3>
                <p className="text-sm mb-3">
                  Gamma shows the rate of change in delta and helps identify key price levels where options activity might "pin" the stock price.
                </p>
                
                <h4 className="text-sm font-medium mb-1">High Gamma Strikes:</h4>
                <div className="space-y-1">
                  {getTopGammaStrikes(optionsData.strikes).slice(0, 5).map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-x-2 text-sm">
                      <div>${item.strike.toFixed(2)}</div>
                      <div>{item.gamma.toFixed(4)}</div>
                      <div className={`${
                        Math.abs(item.strike - currentPrice) < currentPrice * 0.01 ? 'text-blue-500 font-medium' : ''
                      }`}>
                        {Math.abs(item.strike - currentPrice) < currentPrice * 0.01 ? 'Pinning Zone' : 
                         Math.abs(item.strike - currentPrice) < currentPrice * 0.03 ? 'Near Current' : 
                         item.strike > currentPrice ? 'Above Current' : 'Below Current'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-sm">
                  <div className="font-medium">Total Gamma Exposure:</div>
                  <div className={`${
                    sumGammaExposure(optionsData.strikes) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGEX(sumGammaExposure(optionsData.strikes))}
                    <span className="text-muted-foreground ml-2">
                      ({sumGammaExposure(optionsData.strikes) > 0 ? 'Bullish stability' : 
                        sumGammaExposure(optionsData.strikes) < -500000 ? 'Bearish pressure' : 
                        'Potential breakout'})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Vanna Analysis</h3>
                <p className="text-sm mb-3">
                  Vanna shows the change in delta due to changes in implied volatility, important for identifying price sensitivity to volatility changes.
                </p>
                
                <h4 className="text-sm font-medium mb-1">High Vanna Strikes:</h4>
                {findHighVannaStrikes(optionsData.strikes).length > 0 ? (
                  <div className="space-y-1">
                    {findHighVannaStrikes(optionsData.strikes).slice(0, 5).map((strike, index) => (
                      <div key={index} className="text-sm">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                          ${strike.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          IV sensitivity zone
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No significant vanna strikes detected
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mt-4 mb-2">Charm Analysis</h3>
                <p className="text-sm mb-3">
                  Charm (delta decay) shows how delta changes as time passes, helping to identify if support/resistance will strengthen or fade.
                </p>
                
                <div className="text-sm">
                  <span className="font-medium">Current Charm Effect: </span>
                  <span className={`${
                    avgCharmEffect(optionsData.strikes) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {avgCharmEffect(optionsData.strikes) > 0 ? 'Positive' : 'Negative'}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    ({avgCharmEffect(optionsData.strikes) > 0 ? 'Supports trend' : 'Fades trend'})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Volatility Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Implied Volatility Profile:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Implied volatility distribution across strikes shows market expectations for future price movement.
                  </p>
                  
                  <div className="text-sm">
                    <span className="font-medium">IV Skew: </span>
                    <span className={`${
                      calculateIVSkew(optionsData.strikes) > 0.1 ? 'text-red-600' : 
                      calculateIVSkew(optionsData.strikes) < -0.1 ? 'text-green-600' : ''
                    }`}>
                      {calculateIVSkew(optionsData.strikes) > 0.1 ? 'Put Skew' : 
                       calculateIVSkew(optionsData.strikes) < -0.1 ? 'Call Skew' : 'Balanced'}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({calculateIVSkew(optionsData.strikes) > 0.1 ? 'Downside protection demand' : 
                        calculateIVSkew(optionsData.strikes) < -0.1 ? 'Upside exposure demand' : 
                        'Neutral sentiment'})
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Vomma Potential:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vomma (volatility convexity) shows the potential for rapid delta changes in high-volatility scenarios.
                  </p>
                  
                  <div className="text-sm">
                    <span className="font-medium">High Vomma Strikes: </span>
                    {findHighVommaStrikes(optionsData.strikes).length > 0 ? 
                      findHighVommaStrikes(optionsData.strikes).slice(0, 3).map(strike => 
                        <span key={strike} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs mx-1">
                          ${strike.toFixed(0)}
                        </span>
                      ) : 
                      <span className="text-muted-foreground">None detected</span>
                    }
                    
                    <div className="mt-2">
                      <span className="font-medium">Volatility Acceleration Risk: </span>
                      <span className={`${
                        avgVomma(optionsData.strikes) > 0.1 ? 'text-red-600 font-medium' : ''
                      }`}>
                        {avgVomma(optionsData.strikes) > 0.1 ? 'High' : 
                         avgVomma(optionsData.strikes) > 0.05 ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to find nearest level (support or resistance)
function findNearestLevel(price: number, levels: number[], direction: 'above' | 'below'): number {
  if (direction === 'below') {
    // Find the highest level below current price
    const belowLevels = levels.filter(level => level < price);
    return belowLevels.length > 0 ? Math.max(...belowLevels) : levels[0];
  } else {
    // Find the lowest level above current price
    const aboveLevels = levels.filter(level => level > price);
    return aboveLevels.length > 0 ? Math.min(...aboveLevels) : levels[levels.length - 1];
  }
}

// Helper function to get top strikes by value
function getTopStrikes(strikes: number[], values: number[], count: number): {strike: number, value: number}[] {
  return strikes
    .map((strike, index) => ({ strike, value: values[index] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

// Helper function to get top gamma strikes
function getTopGammaStrikes(strikes: StrikeData[]): {strike: number, gamma: number}[] {
  return strikes
    .filter(strike => strike.gamma && strike.gamma > 0)
    .map(strike => ({ strike: strike.strike, gamma: strike.gamma || 0 }))
    .sort((a, b) => b.gamma - a.gamma)
    .slice(0, 5);
}

// Helper function to find strikes with high vanna
function findHighVannaStrikes(strikes: StrikeData[]): number[] {
  return strikes
    .filter(strike => strike.vanna && Math.abs(strike.vanna) > 0.01)
    .map(strike => strike.strike);
}

// Helper function to find strikes with high vomma
function findHighVommaStrikes(strikes: StrikeData[]): number[] {
  return strikes
    .filter(strike => strike.vomma && strike.vomma > 0.1)
    .map(strike => strike.strike);
}

// Helper function to calculate average vomma
function avgVomma(strikes: StrikeData[]): number {
  const vommas = strikes.map(strike => strike.vomma || 0).filter(vomma => vomma > 0);
  if (vommas.length === 0) return 0;
  return vommas.reduce((sum, vomma) => sum + vomma, 0) / vommas.length;
}

// Helper function to calculate average charm effect
function avgCharmEffect(strikes: StrikeData[]): number {
  const charms = strikes.map(strike => strike.charm || 0);
  if (charms.length === 0) return 0;
  return charms.reduce((sum, charm) => sum + charm, 0) / charms.length;
}

// Helper function to calculate IV skew
function calculateIVSkew(strikes: StrikeData[]): number {
  // In a real implementation, this would use actual IV values from the API
  // For now, we'll use a simplified approach based on put/call OI ratio
  
  const atm = strikes.filter(strike => strike.callOpenInterest > 0 && strike.putOpenInterest > 0);
  
  if (atm.length === 0) return 0;
  
  const putCallRatios = atm.map(strike => strike.putOpenInterest / strike.callOpenInterest);
  const avgRatio = putCallRatios.reduce((sum, ratio) => sum + ratio, 0) / putCallRatios.length;
  
  // Normalize to a range between -0.3 and 0.3
  return (avgRatio - 1) * 0.3;
}

// Helper function to calculate total gamma exposure
function sumGammaExposure(strikes: StrikeData[]): number {
  // In a real implementation, this would multiply gamma by notional value and OI
  // For now, we'll use a simplified approach
  
  return strikes.reduce((sum, strike) => {
    const callGamma = (strike.gamma || 0) * strike.callOpenInterest;
    const putGamma = -(strike.gamma || 0) * strike.putOpenInterest;
    return sum + callGamma + putGamma;
  }, 0) * 1000; // Scale for visualization
}

// Helper function to format GEX values
function formatGEX(gex: number): string {
  if (Math.abs(gex) >= 1000000) {
    return `${(gex / 1000000).toFixed(2)}M`;
  } else if (Math.abs(gex) >= 1000) {
    return `${(gex / 1000).toFixed(2)}K`;
  }
  return gex.toFixed(2);
}