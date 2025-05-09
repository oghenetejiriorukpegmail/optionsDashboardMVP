"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TradeSetup() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Trade Setup Rules</h1>
      <p className="text-muted-foreground">
        Define conditions for bullish, bearish, and neutral trading opportunities
      </p>
      
      <Tabs defaultValue="bullish" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bullish">Bullish Setups</TabsTrigger>
          <TabsTrigger value="bearish">Bearish Setups</TabsTrigger>
          <TabsTrigger value="neutral">Neutral Setups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bullish" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Conditions</CardTitle>
                <CardDescription>
                  Technical indicators for bullish setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Bullish Technical Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">EMA Alignment</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Strong Bullish:</span>
                      <span className="text-sm">10 EMA &gt; 20 EMA &gt; 50 EMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Moderate Bullish:</span>
                      <span className="text-sm">10 EMA &gt; 20 EMA, 20 EMA ≈ 50 EMA</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">RSI Conditions</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Zone:</span>
                      <span className="text-sm">RSI between 55-80</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Divergence:</span>
                      <span className="text-sm">Price makes lower low, RSI makes higher low</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Options Conditions</CardTitle>
                <CardDescription>
                  Options indicators for bullish setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Bullish Options Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Put-Call Ratio (PCR)</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Signal:</span>
                      <span className="text-sm">PCR &lt; 0.8 (more calls than puts)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Extreme Bullish:</span>
                      <span className="text-sm">PCR &lt; 0.6 (potential contrarian signal)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Open Interest Patterns</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Call Wall Above:</span>
                      <span className="text-sm">High call OI at higher strikes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Put Wall Below:</span>
                      <span className="text-sm">High put OI at lower strikes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Bullish Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of bullish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Strong Bullish Setup: TSLA</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &gt; 20 EMA &gt; 50 EMA, RSI 65, Stochastic RSI 88</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.8, Call OI increasing at $310 strike, GEX +$600M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 22.5% above 20-day average, increasing on up days</p>
                  <p><span className="font-medium">Strategy:</span> Buy calls with $300 strike, 2-week expiration, target $310, stop at $295</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Moderate Bullish Setup: AAPL</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &gt; 20 EMA, 20 EMA ≈ 50 EMA, RSI 58, Stochastic RSI 65</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.85, Call volume increasing, GEX +$450M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 15% above 20-day average</p>
                  <p><span className="font-medium">Strategy:</span> Buy calls with $175 strike, 3-week expiration, target $180, stop at $172.50</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bearish" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Conditions</CardTitle>
                <CardDescription>
                  Technical indicators for bearish setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Bearish Technical Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">EMA Alignment</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Strong Bearish:</span>
                      <span className="text-sm">10 EMA &lt; 20 EMA &lt; 50 EMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Moderate Bearish:</span>
                      <span className="text-sm">10 EMA &lt; 20 EMA, 20 EMA ≈ 50 EMA</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">RSI Conditions</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Zone:</span>
                      <span className="text-sm">RSI between 20-45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Divergence:</span>
                      <span className="text-sm">Price makes higher high, RSI makes lower high</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Options Conditions</CardTitle>
                <CardDescription>
                  Options indicators for bearish setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Bearish Options Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Put-Call Ratio (PCR)</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Signal:</span>
                      <span className="text-sm">PCR &gt; 1.2 (more puts than calls)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Extreme Bearish:</span>
                      <span className="text-sm">PCR &gt; 1.5 (potential contrarian signal)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Open Interest Patterns</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Put Wall Below:</span>
                      <span className="text-sm">High put OI at lower strikes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Call Wall Below:</span>
                      <span className="text-sm">High call OI at lower strikes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Bearish Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of bearish setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Strong Bearish Setup: META</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &lt; 20 EMA &lt; 50 EMA, RSI 38, Stochastic RSI 35</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.25, Put OI increasing at $300 strike, GEX -$350M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 18.7% above 20-day average, increasing on down days</p>
                  <p><span className="font-medium">Strategy:</span> Buy puts with $310 strike, 2-week expiration, target $300, stop at $315</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Moderate Bearish Setup: INTC</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> 10 EMA &lt; 20 EMA, 20 EMA ≈ 50 EMA, RSI 42, Stochastic RSI 45</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.15, Put volume increasing, GEX -$120M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 12% above 20-day average</p>
                  <p><span className="font-medium">Strategy:</span> Buy puts with $32.5 strike, 3-week expiration, target $30, stop at $33.5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="neutral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Conditions</CardTitle>
                <CardDescription>
                  Technical indicators for neutral setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Neutral Technical Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">EMA Alignment</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flat EMAs:</span>
                      <span className="text-sm">10 EMA ≈ 20 EMA ≈ 50 EMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Converging EMAs:</span>
                      <span className="text-sm">EMAs moving toward each other</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">RSI Conditions</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Neutral Zone:</span>
                      <span className="text-sm">RSI between 45-55</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Oscillating RSI:</span>
                      <span className="text-sm">RSI moving sideways in narrow range</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Options Conditions</CardTitle>
                <CardDescription>
                  Options indicators for neutral setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Neutral Options Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Put-Call Ratio (PCR)</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Neutral Signal:</span>
                      <span className="text-sm">PCR between 0.8-1.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Balanced Flow:</span>
                      <span className="text-sm">Similar call and put volume</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Open Interest Patterns</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">OI Concentration:</span>
                      <span className="text-sm">High OI at current price level</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low GEX:</span>
                      <span className="text-sm">GEX near zero or balanced</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Neutral Setup Examples</CardTitle>
              <CardDescription>
                Real-world examples of neutral setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Range-Bound Setup: MSFT</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> Flat EMAs, RSI 52, trading in $295-$305 range</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 0.95, high OI at $300 strike, GEX +$120M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> 5.3% below 20-day average, decreasing</p>
                  <p><span className="font-medium">Strategy:</span> Sell $300 straddle, 2-week expiration, profit target 50% of premium, stop if price breaks $290/$310</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Pre-Earnings Setup: NVDA</h3>
                  <p className="mb-2"><span className="font-medium">Technical Conditions:</span> Converging EMAs, RSI 58, consolidating before earnings</p>
                  <p className="mb-2"><span className="font-medium">Options Conditions:</span> PCR 1.05, high IV at 52.3%, GEX +$80M</p>
                  <p className="mb-2"><span className="font-medium">Volume:</span> Average volume, no clear direction</p>
                  <p><span className="font-medium">Strategy:</span> Sell iron condor with $850/$900 call spread and $825/$775 put spread, 2-week expiration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
