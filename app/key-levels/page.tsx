"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ChartJSOptionsChain from "@/components/charts/chart-js-options-chain";
import ChartJSTechnical from "@/components/charts/chart-js-technical";
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Key Levels Mapping</h1>
          <p className="text-muted-foreground">
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
                <ChartJSOptionsChain 
                  data={optionsData.strikes}
                  currentPrice={optionsData.price}
                  maxPain={optionsData.maxPain}
                  showVolume={showVolume}
                  title={`${symbol} Options Chain - ${expiration}`}
                />
              )}
              
              <div className="mt-4 overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Strike</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Call OI</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Call Vol</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Call IV</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Put OI</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Put Vol</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Put IV</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {optionsData.strikes.map((strike) => (
                      <tr 
                        key={strike.strike} 
                        className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${strike.strike === optionsData.maxPain ? "bg-muted/50" : ""}`}
                      >
                        <td className="p-4 align-middle font-medium">{strike.strike}</td>
                        <td className="p-4 align-middle">{strike.call.oi.toLocaleString()}</td>
                        <td className="p-4 align-middle">{strike.call.volume.toLocaleString()}</td>
                        <td className="p-4 align-middle">{strike.call.iv.toFixed(1)}%</td>
                        <td className="p-4 align-middle">{strike.put.oi.toLocaleString()}</td>
                        <td className="p-4 align-middle">{strike.put.volume.toLocaleString()}</td>
                        <td className="p-4 align-middle">{strike.put.iv.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Max Pain: ${optionsData.maxPain}</h3>
                  <p className="text-sm text-muted-foreground">
                    The strike price where option holders (both puts and calls) would lose the most money at expiration
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">GEX: {optionsData.gex >= 0 ? "+" : ""}{(optionsData.gex / 1000000).toFixed(0)}M</h3>
                  <p className="text-sm text-muted-foreground">
                    {optionsData.gex > 0 
                      ? "Positive gamma exposure indicates market maker hedging will dampen volatility" 
                      : "Negative gamma exposure indicates market maker hedging may increase volatility"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gamma Analysis</CardTitle>
                <CardDescription>
                  Gamma concentration across strike prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Gamma Concentration Visualization</p>
                    <p className="text-xs text-muted-foreground ml-2">(Coming soon in next update)</p>
                  </div>
                  
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
                  <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Charm & Vanna Visualization</p>
                    <p className="text-xs text-muted-foreground ml-2">(Coming soon in next update)</p>
                  </div>
                  
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
          </div>
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
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bullish Level Example: {symbol}</h3>
                  <p className="mb-2"><span className="font-medium">Current Price:</span> ${optionsData.price.toFixed(2)}</p>
                  <p className="mb-2"><span className="font-medium">Technical Support:</span> ${technicalData.keyLevels.support[1]} (recent consolidation)</p>
                  <p className="mb-2"><span className="font-medium">Options Support:</span> ${technicalData.keyLevels.maxPain} (max pain, high call OI)</p>
                  <p className="mb-2"><span className="font-medium">Technical Resistance:</span> ${technicalData.keyLevels.resistance[0]} (recent high)</p>
                  <p><span className="font-medium">Strategy:</span> Buy calls with ${technicalData.keyLevels.maxPain} strike, set stop below ${technicalData.keyLevels.support[1]} support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
