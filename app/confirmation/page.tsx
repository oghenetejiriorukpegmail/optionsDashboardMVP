"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Confirmation() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Confirmation & Timing</h1>
      <p className="text-muted-foreground">
        Ensure precise entries and exits with confirmation signals
      </p>
      
      <Tabs defaultValue="entry" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Entry Triggers</TabsTrigger>
          <TabsTrigger value="exit">Exit Triggers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entry" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Confirmation</CardTitle>
                <CardDescription>
                  Technical indicators that confirm entry timing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Stochastic RSI Hooks Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Stochastic RSI Hooks</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Entry:</span>
                      <span className="text-sm">Stochastic RSI hooks up from &lt; 60</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Entry:</span>
                      <span className="text-sm">Stochastic RSI hooks down from &gt; 40</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Volume Confirmation</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Volume Spike:</span>
                      <span className="text-sm">Above 20-day average volume</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trend Confirmation:</span>
                      <span className="text-sm">Volume increasing in trend direction</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Options Confirmation</CardTitle>
                <CardDescription>
                  Options metrics that validate entry timing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Options Flow Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Open Interest Changes</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Signal:</span>
                      <span className="text-sm">Rising OI in higher strike calls</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Signal:</span>
                      <span className="text-sm">Rising OI in lower strike puts</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Options Volume</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Flow:</span>
                      <span className="text-sm">High call volume with rising prices</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Flow:</span>
                      <span className="text-sm">High put volume with falling prices</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Entry Examples</CardTitle>
              <CardDescription>
                Real-world examples of entry confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bullish Entry Example: TSLA</h3>
                  <p className="mb-2"><span className="font-medium">Setup:</span> Bullish trend with 10 EMA &gt; 20 EMA &gt; 50 EMA, PCR 0.8, RSI 65</p>
                  <p className="mb-2"><span className="font-medium">Confirmation:</span> Stochastic RSI hooks up from 55 to 65, volume spikes 30% above average</p>
                  <p className="mb-2"><span className="font-medium">Options Activity:</span> Call volume at $300 strike increases 50%, OI rising at $310 strike</p>
                  <p><span className="font-medium">Action:</span> Enter long position with $300 calls expiring in 2 weeks</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bearish Entry Example: META</h3>
                  <p className="mb-2"><span className="font-medium">Setup:</span> Bearish trend with 10 EMA &lt; 20 EMA &lt; 50 EMA, PCR 1.25, RSI 38</p>
                  <p className="mb-2"><span className="font-medium">Confirmation:</span> Stochastic RSI hooks down from 45 to 35, volume spikes 25% above average</p>
                  <p className="mb-2"><span className="font-medium">Options Activity:</span> Put volume at $310 strike increases 40%, OI rising at $300 strike</p>
                  <p><span className="font-medium">Action:</span> Enter short position with $310 puts expiring in 2 weeks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Exit Signals</CardTitle>
                <CardDescription>
                  Technical indicators that signal when to exit trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">RSI Extremes Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">RSI Extremes</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overbought Exit:</span>
                      <span className="text-sm">RSI &gt; 80 for bullish trades</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Oversold Exit:</span>
                      <span className="text-sm">RSI &lt; 20 for bearish trades</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Stochastic RSI Reversals</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Exit:</span>
                      <span className="text-sm">Stochastic RSI hooks down from &gt; 80</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Exit:</span>
                      <span className="text-sm">Stochastic RSI hooks up from &lt; 20</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Options Exit Signals</CardTitle>
                <CardDescription>
                  Options metrics that signal when to exit trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">OI/GEX Levels Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Price at Key Levels</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Target Reached:</span>
                      <span className="text-sm">Price reaches high OI strike level</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">GEX Reversal:</span>
                      <span className="text-sm">Price reaches high GEX concentration</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Options Flow Reversal</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Exit:</span>
                      <span className="text-sm">Put volume surges relative to calls</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Exit:</span>
                      <span className="text-sm">Call volume surges relative to puts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Exit Examples</CardTitle>
              <CardDescription>
                Real-world examples of exit confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bullish Exit Example: TSLA</h3>
                  <p className="mb-2"><span className="font-medium">Original Trade:</span> Long $300 calls with target of $310</p>
                  <p className="mb-2"><span className="font-medium">Exit Signal:</span> Price reaches $310 (target OI level), RSI at 82 (overbought)</p>
                  <p className="mb-2"><span className="font-medium">Options Activity:</span> Put volume increasing, GEX showing resistance at $310</p>
                  <p><span className="font-medium">Action:</span> Exit long position with 35% profit</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bearish Exit Example: META</h3>
                  <p className="mb-2"><span className="font-medium">Original Trade:</span> Long $310 puts with target of $300</p>
                  <p className="mb-2"><span className="font-medium">Exit Signal:</span> Price reaches $300 (target OI level), Stochastic RSI hooks up from 15</p>
                  <p className="mb-2"><span className="font-medium">Options Activity:</span> Call volume increasing, GEX showing support at $300</p>
                  <p><span className="font-medium">Action:</span> Exit short position with 28% profit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
