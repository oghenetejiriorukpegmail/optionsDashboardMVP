"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { calculatePositionSize } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BadgeCheck, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RiskManagement() {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.5);
  const [iv, setIv] = useState<number>(45);
  const [stockPrice, setStockPrice] = useState<number>(300);
  const [optionPremium, setOptionPremium] = useState<number>(8.5);
  const [gexAdjustment, setGexAdjustment] = useState<string>("none");
  const [positionData, setPositionData] = useState<any>({
    maxRiskAmount: 150,
    contractsToTrade: 1,
    totalInvestment: 850,
    percentageOfAccount: 8.5,
    riskPerContract: 850,
    totalRisk: 850,
    stopLossPrice: null,
    adjustments: {
      ivAdjustment: 0.85,
      ivAdjustmentReason: "Position size reduced by 15% due to moderate-high IV (>45%)",
      gexFactor: 1.0,
      gexAdjustmentReason: "No GEX adjustment applied"
    },
    riskNote: "Total risk (850.00) is within your maximum risk amount (150.00)."
  });
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatePosition = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculatePositionSize({
        accountSize,
        riskPercentage,
        optionPremium,
        stockPrice,
        iv,
        gexAdjustment
      });
      
      if (result.success) {
        setPositionData(result);
        setDataSource(result.dataSource || "calculation");
        toast.success("Position size calculated successfully");
      } else {
        setError(result.message || "Failed to calculate position size");
        toast.error(result.message || "Failed to calculate position size");
      }
    } catch (error) {
      console.error("Error calculating position size:", error);
      setError("An error occurred while calculating position size");
      toast.error("An error occurred while calculating position size");
    } finally {
      setLoading(false);
    }
  };

  // Calculate position on initial load
  useEffect(() => {
    calculatePosition();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
      <p className="text-muted-foreground">
        Protect capital with disciplined risk management rules
      </p>
      
      <Tabs defaultValue="position-sizing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
          <TabsTrigger value="stop-loss">Stop Loss Strategy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="position-sizing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Size Calculator</CardTitle>
              <CardDescription>
                Calculate appropriate position size based on account size, risk parameters, and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {dataSource === "client-side fallback" && (
                  <Alert variant="warning">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Using fallback calculation</AlertTitle>
                    <AlertDescription>
                      The position size was calculated locally due to server unavailability.
                      This is an approximate calculation and may differ from the server calculation.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Account Size ($)</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter account size"
                      type="number"
                      value={accountSize}
                      onChange={(e) => setAccountSize(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Risk Per Trade (%)</label>
                    <div className="pt-4">
                      <Slider 
                        defaultValues={[riskPercentage]} 
                        max={5} 
                        step={0.1} 
                        onValueChange={(values) => setRiskPercentage(values[0])}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">0.5%</span>
                        <span className="text-xs font-medium">{riskPercentage}%</span>
                        <span className="text-xs">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Stock Price ($)</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter stock price"
                      type="number"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Option Premium ($)</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter option premium"
                      type="number"
                      step="0.01"
                      value={optionPremium}
                      onChange={(e) => setOptionPremium(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Implied Volatility (%)</label>
                    <div className="pt-4">
                      <Slider 
                        defaultValues={[iv]} 
                        max={100} 
                        step={5} 
                        onValueChange={(values) => setIv(values[0])}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">Low (20%)</span>
                        <span className="text-xs font-medium">{iv}%</span>
                        <span className="text-xs">High (80%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gamma Exposure (GEX)</label>
                    <Select 
                      value={gexAdjustment}
                      onValueChange={setGexAdjustment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select GEX level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Normal GEX (No adjustment)</SelectItem>
                        <SelectItem value="extreme_positive">Extremely Positive GEX (&gt;$1B)</SelectItem>
                        <SelectItem value="high_positive">High Positive GEX (&gt;$500M)</SelectItem>
                        <SelectItem value="near_zero">Near-Zero GEX (&lt;$200M)</SelectItem>
                        <SelectItem value="high_negative">High Negative GEX (&lt;-$500M)</SelectItem>
                        <SelectItem value="extreme_negative">Extremely Negative GEX (&lt;-$1B)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      GEX affects market stability and price movement expectations
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={calculatePosition} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate Position Size"
                  )}
                </Button>
                
                <div className="rounded-md border p-4 bg-muted/50">
                  <h3 className="text-lg font-medium mb-4">Calculated Position Size</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm mb-1">Maximum Risk Amount:</p>
                      <p className="text-xl font-bold">${positionData.maxRiskAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Recommended Contracts:</p>
                      <p className="text-xl font-bold">{positionData.contractsToTrade} {positionData.contractsToTrade === 1 ? 'Contract' : 'Contracts'}</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Total Investment:</p>
                      <p className="text-xl font-bold">${positionData.totalInvestment}</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Percentage of Account:</p>
                      <p className="text-xl font-bold">{positionData.percentageOfAccount}%</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Risk Per Contract:</p>
                      <p className="text-xl font-bold">${positionData.riskPerContract}</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Total Risk:</p>
                      <p className="text-xl font-bold">${positionData.totalRisk}</p>
                    </div>
                  </div>
                  
                  {positionData.stopLossPrice && (
                    <div className="mt-4 p-3 bg-background rounded-md">
                      <p className="text-sm mb-1">Suggested Stop Loss Price:</p>
                      <p className="text-xl font-bold">${positionData.stopLossPrice}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Applied Adjustments</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <BadgeCheck className="h-4 w-4 mt-0.5 mr-2 text-blue-500" />
                        <span>IV Adjustment: {positionData.adjustments.ivAdjustmentReason}</span>
                      </div>
                      <div className="flex items-start">
                        <BadgeCheck className="h-4 w-4 mt-0.5 mr-2 text-blue-500" />
                        <span>GEX Adjustment: {positionData.adjustments.gexAdjustmentReason}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-background rounded-md">
                    <p className="text-sm font-medium">Risk Assessment:</p>
                    <p className="text-sm">{positionData.riskNote}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Position Sizing Rules</h3>
                  <div className="rounded-md border p-4">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Adjust position size based on IV (e.g., 1.5% of account for TSLA at 45% IV)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Scale down in high vomma/GEX scenarios to reduce volatility exposure</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>For stocks with IV {'>'} 60%, reduce position size by additional 30%</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Near-zero GEX (&lt;$200M) indicates potential breakout, can increase position slightly</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Never risk more than 5% of account on a single trade</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stop-loss" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Technical Stop Loss</CardTitle>
                <CardDescription>
                  Set stop loss levels based on technical indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Stop Loss Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">EMA-Based Stops</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Trade:</span>
                      <span className="text-sm">Stop below 10-day or 20-day EMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Trade:</span>
                      <span className="text-sm">Stop above 10-day or 20-day EMA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Neutral Trade:</span>
                      <span className="text-sm">Stop outside expected range (above R1/below S1)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Support/Resistance Stops</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bullish Trade:</span>
                      <span className="text-sm">Stop below key support level</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bearish Trade:</span>
                      <span className="text-sm">Stop above key resistance level</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Neutral Trade:</span>
                      <span className="text-sm">Stops at both key support and resistance levels</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Percentage-Based Stop Loss</CardTitle>
                <CardDescription>
                  Set stop loss levels based on percentage of investment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Percentage Stop Loss Visualization</p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Fixed Percentage</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conservative:</span>
                      <span className="text-sm">1% loss from entry</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Moderate:</span>
                      <span className="text-sm">1.5% loss from entry</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aggressive:</span>
                      <span className="text-sm">2% loss from entry</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Volatility-Adjusted</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low IV (&lt;35%):</span>
                      <span className="text-sm">1% loss from entry</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium IV (35-60%):</span>
                      <span className="text-sm">1.5% loss from entry</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High IV ({'>'}60%):</span>
                      <span className="text-sm">2% loss from entry</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Stop Loss Examples</CardTitle>
              <CardDescription>
                Real-world examples of stop loss placement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bullish Stop Loss Example: TSLA</h3>
                  <p className="mb-2"><span className="font-medium">Trade:</span> Long $300 calls with entry at $300</p>
                  <p className="mb-2"><span className="font-medium">Technical Stop:</span> Below 20-day EMA at $295</p>
                  <p className="mb-2"><span className="font-medium">Percentage Stop:</span> 1.5% below entry at $295.50</p>
                  <p><span className="font-medium">Selected Stop:</span> $295 (technical level, 1.67% loss)</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Bearish Stop Loss Example: META</h3>
                  <p className="mb-2"><span className="font-medium">Trade:</span> Long $310 puts with entry at $310</p>
                  <p className="mb-2"><span className="font-medium">Technical Stop:</span> Above key resistance at $315</p>
                  <p className="mb-2"><span className="font-medium">Percentage Stop:</span> 1.5% above entry at $314.65</p>
                  <p><span className="font-medium">Selected Stop:</span> $315 (technical level, 1.61% loss)</p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Neutral Stop Loss Example: MSFT</h3>
                  <p className="mb-2"><span className="font-medium">Trade:</span> Iron Condor with price at $300</p>
                  <p className="mb-2"><span className="font-medium">Technical Stops:</span> Below support at $290 or above resistance at $310</p>
                  <p className="mb-2"><span className="font-medium">Percentage Stop:</span> 50% of premium received</p>
                  <p><span className="font-medium">Selected Stop:</span> Price breaks $290/$310 or 50% of premium lost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
