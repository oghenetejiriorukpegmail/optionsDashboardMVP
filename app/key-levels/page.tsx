"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ChartJSOptionsChain from "@/components/charts/chart-js-options-chain";
import ChartJSTechnical from "@/components/charts/chart-js-technical";
import EnhancedOptionsChain from "@/components/charts/enhanced/EnhancedOptionsChain";
import GammaConcentration from "@/components/charts/GammaConcentration";
import CharmVannaChart from "@/components/charts/CharmVannaChart";
import BullishTechnicalChart from "@/components/charts/BullishTechnicalChart";
import BullishOptionsVisualizer from "@/components/charts/BullishOptionsVisualizer";
import { fetchOptionsChain, fetchTechnicalIndicators } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

// Mock data for demo
const mockOptionsChain = {
  symbol: 'TSLA',
  price: 300.00,
  expirations: ['2025-04-18', '2025-04-25', '2025-05-02', '2025-05-16'],
  selectedExpiration: '2025-04-25',
  strikes: [
    {
      strike: 270,
      call: {
        oi: 7500,
        volume: 920,
        iv: 41.8,
        gamma: 0.021,
        charm: 0.014,
        vanna: 0.28,
        vomma: 0.11
      },
      put: {
        oi: 13200,
        volume: 2450,
        iv: 44.2,
        gamma: 0.018,
        charm: -0.020,
        vanna: -0.31,
        vomma: 0.10
      }
    },
    {
      strike: 280,
      call: {
        oi: 8200,
        volume: 1050,
        iv: 42.5,
        gamma: 0.028,
        charm: 0.015,
        vanna: 0.32,
        vomma: 0.12
      },
      put: {
        oi: 12500,
        volume: 2300,
        iv: 43.8,
        gamma: 0.022,
        charm: -0.018,
        vanna: -0.28,
        vomma: 0.11
      }
    },
    {
      strike: 290,
      call: {
        oi: 8500,
        volume: 1200,
        iv: 43.2,
        gamma: 0.03,
        charm: 0.018,
        vanna: 0.35,
        vomma: 0.13
      },
      put: {
        oi: 12000,
        volume: 2500,
        iv: 44.1,
        gamma: 0.02,
        charm: -0.02,
        vanna: -0.3,
        vomma: 0.12
      }
    },
    {
      strike: 300,
      call: {
        oi: 15000,
        volume: 3500,
        iv: 44.8,
        gamma: 0.05,
        charm: 0.02,
        vanna: 0.42,
        vomma: 0.15
      },
      put: {
        oi: 9800,
        volume: 1800,
        iv: 44.5,
        gamma: 0.04,
        charm: -0.022,
        vanna: -0.38,
        vomma: 0.14
      }
    },
    {
      strike: 310,
      call: {
        oi: 12500,
        volume: 2800,
        iv: 45.5,
        gamma: 0.04,
        charm: 0.019,
        vanna: 0.45,
        vomma: 0.14
      },
      put: {
        oi: 7500,
        volume: 1200,
        iv: 45.2,
        gamma: 0.03,
        charm: -0.018,
        vanna: -0.32,
        vomma: 0.13
      }
    },
    {
      strike: 320,
      call: {
        oi: 9800,
        volume: 1500,
        iv: 46.2,
        gamma: 0.035,
        charm: 0.017,
        vanna: 0.38,
        vomma: 0.13
      },
      put: {
        oi: 6200,
        volume: 950,
        iv: 45.8,
        gamma: 0.025,
        charm: -0.016,
        vanna: -0.28,
        vomma: 0.12
      }
    },
    {
      strike: 330,
      call: {
        oi: 8300,
        volume: 1200,
        iv: 46.8,
        gamma: 0.030,
        charm: 0.015,
        vanna: 0.34,
        vomma: 0.12
      },
      put: {
        oi: 5400,
        volume: 780,
        iv: 46.2,
        gamma: 0.022,
        charm: -0.014,
        vanna: -0.25,
        vomma: 0.11
      }
    }
  ],
  maxPain: 300,
  gex: 600000000
};

const mockTechnicalData = {
  symbol: 'TSLA',
  price: 300.00,
  historicalData: [
    { date: '2025-04-15', close: 300.00, ema10: 298.50, ema20: 295.20, ema50: 290.80, volume: 12500000, rsi: 65 },
    { date: '2025-04-14', close: 298.75, ema10: 297.80, ema20: 294.90, ema50: 290.50, volume: 11200000, rsi: 64 },
    { date: '2025-04-13', close: 297.50, ema10: 297.20, ema20: 294.60, ema50: 290.20, volume: 9800000, rsi: 63 },
    { date: '2025-04-12', close: 296.25, ema10: 296.50, ema20: 294.30, ema50: 289.90, volume: 10500000, rsi: 62 },
    { date: '2025-04-11', close: 295.00, ema10: 295.80, ema20: 294.00, ema50: 289.60, volume: 11800000, rsi: 61 },
    { date: '2025-04-10', close: 293.75, ema10: 295.10, ema20: 293.70, ema50: 289.30, volume: 10200000, rsi: 60 },
    { date: '2025-04-09', close: 292.50, ema10: 294.40, ema20: 293.40, ema50: 289.00, volume: 9500000, rsi: 59 },
    { date: '2025-04-08', close: 291.25, ema10: 293.70, ema20: 293.10, ema50: 288.70, volume: 10800000, rsi: 58 },
    { date: '2025-04-07', close: 290.00, ema10: 293.00, ema20: 292.80, ema50: 288.40, volume: 12200000, rsi: 57 },
    { date: '2025-04-06', close: 288.75, ema10: 292.30, ema20: 292.50, ema50: 288.10, volume: 11500000, rsi: 56 }
  ],
  keyLevels: {
    support: [290, 295],
    resistance: [305, 310],
    maxPain: 300
  }
};

export default function KeyLevels() {
  const [symbol, setSymbol] = useState("TSLA");
  const [expiration, setExpiration] = useState("2025-04-25");
  const [optionsData, setOptionsData] = useState(mockOptionsChain);
  const [technicalData, setTechnicalData] = useState(mockTechnicalData);
  const [showVolume, setShowVolume] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // In a real implementation, these would fetch from the API
        // const optionsChainData = await fetchOptionsChain(symbol, expiration);
        // const technicalIndicatorsData = await fetchTechnicalIndicators(symbol);
        
        // For demo, we're using mock data
        setOptionsData(mockOptionsChain);
        setTechnicalData(mockTechnicalData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [symbol, expiration]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-8 h-8 bg-indigo-500/10 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Key Levels Mapping</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Identify critical price levels using options chain data and technical analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TSLA">TSLA</SelectItem>
              <SelectItem value="AAPL">AAPL</SelectItem>
              <SelectItem value="META">META</SelectItem>
              <SelectItem value="MSFT">MSFT</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={expiration} onValueChange={setExpiration}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Expiration" />
            </SelectTrigger>
            <SelectContent>
              {optionsData.expirations.map((date) => (
                <SelectItem key={date} value={date}>{date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="options-chain" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="options-chain">Options Chain Analysis</TabsTrigger>
          <TabsTrigger value="support-resistance">Support & Resistance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="options-chain" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle>Options Chain Visualization</CardTitle>
                <CardDescription>
                  Open interest, volume, and greeks across strike prices
                </CardDescription>
              </div>
              <div>
                <Button
                  variant={showVolume ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                >
                  {showVolume ? "Show OI" : "Show Volume"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <EnhancedOptionsChain
                  data={optionsData.strikes}
                  currentPrice={optionsData.price}
                  maxPain={optionsData.maxPain}
                  displayMode={showVolume ? 'volume' : 'openInterest'}
                  title={`${symbol} Options Chain - ${expiration}`}
                  height={400}
                  isLoading={loading}
                  showAnimation={true}
                />
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 bg-card">
                  <h3 className="text-lg font-medium flex items-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    Max Pain Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    The strike price where option holders (both puts and calls) would lose the most money at expiration.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Max Pain Level:</span>
                      <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">
                        ${optionsData.maxPain}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Distance from Current:</span>
                      <span className={`text-sm font-mono ${
                        Math.abs(optionsData.price - optionsData.maxPain) < (optionsData.price * 0.02)
                          ? "text-green-500"
                          : Math.abs(optionsData.price - optionsData.maxPain) < (optionsData.price * 0.05)
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}>
                        {Math.abs(((optionsData.maxPain / optionsData.price) - 1) * 100).toFixed(1)}%
                        {optionsData.maxPain > optionsData.price ? " above" : " below"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Expiration Effect:</span>
                      <span className="text-sm">
                        {Math.abs(optionsData.price - optionsData.maxPain) < (optionsData.price * 0.02)
                          ? "Likely to remain near current price"
                          : optionsData.maxPain > optionsData.price
                          ? "May drift higher into expiration"
                          : "May drift lower into expiration"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-card">
                  <h3 className="text-lg font-medium flex items-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    Gamma Exposure (GEX)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Measures market maker hedging impact on price movement.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Net GEX:</span>
                      <span className={`text-sm font-mono ${
                        optionsData.gex > 1000000
                          ? "text-green-500"
                          : optionsData.gex < -1000000
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}>
                        {optionsData.gex >= 0 ? "+" : ""}{(optionsData.gex / 1000000).toFixed(2)}M
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Market Impact:</span>
                      <span className="text-sm">
                        {optionsData.gex > 1000000
                          ? "Stabilizing (resistance to downside)"
                          : optionsData.gex < -1000000
                          ? "Destabilizing (amplifies moves)"
                          : "Neutral (limited impact)"
                        }
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Volatility Effect:</span>
                      <span className={`text-sm ${
                        optionsData.gex > 1000000
                          ? "text-green-500"
                          : optionsData.gex < -1000000
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}>
                        {optionsData.gex > 1000000
                          ? "Dampened - MM hedging fights moves"
                          : optionsData.gex < -1000000
                          ? "Amplified - MM hedging accelerates moves"
                          : "Normal volatility expected"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <div className="text-sm font-medium mb-2">Options Chain Data</div>
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-10 px-4 text-left align-middle font-medium">Strike</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Call OI</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Call Vol</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Call IV</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Gamma</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Put OI</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Put Vol</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Put IV</th>
                      <th className="h-10 px-4 text-left align-middle font-medium">Gamma</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {optionsData.strikes.map((strike) => (
                      <tr
                        key={strike.strike}
                        className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                          strike.strike === optionsData.maxPain
                            ? "bg-purple-50 dark:bg-purple-900/20"
                            : Math.abs(strike.strike - optionsData.price) < 1
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        <td className="p-2 align-middle font-medium">
                          ${strike.strike}
                          {strike.strike === optionsData.maxPain &&
                            <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">MP</span>
                          }
                          {Math.abs(strike.strike - optionsData.price) < 1 &&
                            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">CP</span>
                          }
                        </td>
                        <td className="p-2 align-middle">{strike.call.oi.toLocaleString()}</td>
                        <td className="p-2 align-middle">{strike.call.volume.toLocaleString()}</td>
                        <td className="p-2 align-middle">{strike.call.iv.toFixed(1)}%</td>
                        <td className="p-2 align-middle text-green-600">{strike.call.gamma.toFixed(3)}</td>
                        <td className="p-2 align-middle">{strike.put.oi.toLocaleString()}</td>
                        <td className="p-2 align-middle">{strike.put.volume.toLocaleString()}</td>
                        <td className="p-2 align-middle">{strike.put.iv.toFixed(1)}%</td>
                        <td className="p-2 align-middle text-red-600">{strike.put.gamma.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gamma Analysis</CardTitle>
              <CardDescription>
                Gamma concentration across strike prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <GammaConcentration
                  data={optionsData.strikes}
                  currentPrice={optionsData.price}
                  maxPain={optionsData.maxPain}
                  height={250}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Gamma Interpretation</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High Gamma Strike:</span>
                      <span className="text-sm">${optionsData.maxPain} (acts as magnet)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gamma Flip Point:</span>
                      <span className="text-sm">${optionsData.price - 5} (negative below, positive above)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Trading Implications</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Price Magnet:</span>
                      <span className="text-sm">Price likely to gravitate toward ${optionsData.maxPain}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Volatility Impact:</span>
                      <span className="text-sm">
                        {optionsData.gex > 0
                          ? `Reduced volatility near $${optionsData.maxPain}`
                          : `Increased volatility if price moves away from $${optionsData.maxPain}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charm & Vanna Analysis</CardTitle>
              <CardDescription>
                Time decay of delta and volatility impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CharmVannaChart
                  data={optionsData.strikes}
                  currentPrice={optionsData.price}
                  height={250}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Charm (Delta Decay)</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Positive Charm:</span>
                      <span className="text-sm">Delta increases as time passes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Negative Charm:</span>
                      <span className="text-sm">Delta decreases as time passes</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Vanna (Volatility-Delta)</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Positive Vanna:</span>
                      <span className="text-sm">Delta increases as IV rises</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Negative Vanna:</span>
                      <span className="text-sm">Delta decreases as IV rises</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support-resistance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price and Technical Levels</CardTitle>
              <CardDescription>
                Historical price chart with key support and resistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ChartJSTechnical 
                  data={technicalData.historicalData}
                  title={`${symbol} Price & EMA Chart`}
                />
              )}
              
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Support Levels</h3>
                  <div className="rounded-md border p-4">
                    <ul className="space-y-2">
                      {technicalData.keyLevels.support.map((level, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span className="text-sm">S{index + 1}:</span>
                          <span className="text-sm font-medium">${level}</span>
                          <span className="text-sm text-muted-foreground">
                            {index === 0 ? "Strong support (previous resistance)" : "Moderate support"}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between items-center">
                        <span className="text-sm">10 EMA:</span>
                        <span className="text-sm font-medium">${technicalData.historicalData[0].ema10.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">Dynamic support</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">20 EMA:</span>
                        <span className="text-sm font-medium">${technicalData.historicalData[0].ema20.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">Trend support</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Resistance Levels</h3>
                  <div className="rounded-md border p-4">
                    <ul className="space-y-2">
                      {technicalData.keyLevels.resistance.map((level, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span className="text-sm">R{index + 1}:</span>
                          <span className="text-sm font-medium">${level}</span>
                          <span className="text-sm text-muted-foreground">
                            {index === 0 ? "Immediate resistance" : "Strong resistance"}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Max Pain:</span>
                        <span className="text-sm font-medium">${technicalData.keyLevels.maxPain}</span>
                        <span className="text-sm text-muted-foreground">Options magnet</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">High OI Call:</span>
                        <span className="text-sm font-medium">${optionsData.strikes[2].strike}</span>
                        <span className="text-sm text-muted-foreground">Potential resistance</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Level Integration Examples</CardTitle>
              <CardDescription>
                Real-world examples of key level mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bullish Technical Analysis</h3>
                  <BullishTechnicalChart
                    data={technicalData.historicalData}
                    keyLevels={technicalData.keyLevels}
                    height={350}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bullish Options Strategy</h3>
                  <BullishOptionsVisualizer
                    strikes={optionsData.strikes}
                    currentPrice={optionsData.price}
                    keyLevels={technicalData.keyLevels}
                    height={300}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
