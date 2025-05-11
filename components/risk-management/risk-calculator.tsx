"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { calculatePositionSize } from "@/lib/api";
import { toast } from "../ui/sonner";
import { Info, AlertTriangle, DollarSign, BarChart } from "lucide-react";

interface RiskCalculatorProps {
  symbol: string;
  stockData: {
    price: number;
    setupType: string;
    iv: number;
    gex: number;
    recommendation: {
      action: string;
      target: number | string;
      stop: number | string;
      expiration: string;
      strike: number;
    };
  };
}

export function RiskCalculator({ symbol, stockData }: RiskCalculatorProps) {
  // State for calculator inputs
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [optionPremium, setOptionPremium] = useState<number>(2.5);
  const [gexAdjustment, setGexAdjustment] = useState<string>('normal');
  
  // State for calculation results
  const [calculationResult, setCalculationResult] = useState<{
    contractsToTrade: number;
    maxRisk: number;
    adjustedRisk: number;
    riskRatio: number;
    potentialProfit: number;
    profitPercentage: number;
  } | null>(null);
  
  // Determine an estimated option premium based on current price and IV
  const estimatedPremium = calculateEstimatedPremium(stockData.price, stockData.iv, stockData.setupType);
  
  // Function to calculate risk and position size
  const handleCalculate = async () => {
    try {
      // Validate inputs
      if (accountSize <= 0) {
        toast.error("Account size must be greater than zero");
        return;
      }
      
      if (riskPercentage <= 0 || riskPercentage > 5) {
        toast.error("Risk percentage should be between 0.1% and 5%");
        return;
      }
      
      if (optionPremium <= 0) {
        toast.error("Option premium must be greater than zero");
        return;
      }
      
      // Calculate locally or call API
      const maxRiskAmount = accountSize * (riskPercentage / 100);
      let contractsToTrade = Math.floor(maxRiskAmount / optionPremium);
      
      // Apply adjustments based on IV and GEX
      let adjustmentFactor = 1.0;
      
      // IV adjustment
      if (stockData.iv > 60) {
        adjustmentFactor *= 0.8; // Reduce position size in high IV
      } else if (stockData.iv < 20) {
        adjustmentFactor *= 1.2; // Increase position size in low IV
      }
      
      // GEX adjustment
      if (gexAdjustment === 'conservative') {
        adjustmentFactor *= 0.8;
      } else if (gexAdjustment === 'aggressive') {
        adjustmentFactor *= 1.2;
      }
      
      // Calculate adjusted contracts
      const adjustedContracts = Math.floor(contractsToTrade * adjustmentFactor);
      
      // Ensure minimum contracts
      const finalContracts = Math.max(1, adjustedContracts);
      
      // Calculate adjusted risk amount
      const adjustedRisk = finalContracts * optionPremium;
      
      // Calculate risk/reward metrics
      const potentialProfitPerContract = calculatePotentialProfit(
        stockData.price,
        stockData.recommendation.strike,
        optionPremium,
        stockData.setupType
      );
      
      const totalPotentialProfit = potentialProfitPerContract * finalContracts;
      const profitPercentage = (totalPotentialProfit / accountSize) * 100;
      
      // Calculate risk/reward ratio
      const riskRatio = totalPotentialProfit / adjustedRisk;
      
      // Set results
      setCalculationResult({
        contractsToTrade: finalContracts,
        maxRisk: adjustedRisk,
        adjustedRisk: accountSize * (adjustedRisk / accountSize) * 100,
        riskRatio,
        potentialProfit: totalPotentialProfit,
        profitPercentage
      });
      
      toast.success("Position size calculated");
    } catch (error) {
      console.error("Error calculating position size:", error);
      toast.error("Failed to calculate position size");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Risk Management for {symbol}</CardTitle>
        <CardDescription>
          Calculate optimal position size and risk parameters for your trade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calculator">Position Calculator</TabsTrigger>
            <TabsTrigger value="guidelines">Risk Guidelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Account Parameters</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-size">Account Size ($)</Label>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                      <Input 
                        id="account-size"
                        type="number"
                        value={accountSize}
                        onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                        placeholder="10000"
                        min="1000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="risk-percentage">Risk Percentage</Label>
                      <span className="text-sm text-muted-foreground">{riskPercentage}%</span>
                    </div>
                    <Slider
                      id="risk-percentage"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={[riskPercentage]}
                      onValueChange={(value) => setRiskPercentage(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Conservative (0.5%)</span>
                      <span>Moderate (1-2%)</span>
                      <span>Aggressive (3-5%)</span>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                      <div>
                        <p>Max risk amount: <span className="font-medium">${(accountSize * riskPercentage / 100).toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This is the maximum amount you're willing to risk on this trade based on your risk percentage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Option Parameters</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="option-premium">Option Premium ($)</Label>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                      <Input 
                        id="option-premium"
                        type="number"
                        value={optionPremium}
                        onChange={(e) => setOptionPremium(parseFloat(e.target.value) || 0)}
                        placeholder="2.50"
                        min="0.01"
                        step="0.05"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimated premium for {stockData.recommendation.action}: ${estimatedPremium.toFixed(2)} based on current IV ({stockData.iv.toFixed(1)}%)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>GEX Adjustment</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={gexAdjustment === 'conservative' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGexAdjustment('conservative')}
                        className={gexAdjustment === 'conservative' ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        Conservative
                      </Button>
                      
                      <Button 
                        variant={gexAdjustment === 'normal' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGexAdjustment('normal')}
                        className={gexAdjustment === 'normal' ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        Normal
                      </Button>
                      
                      <Button 
                        variant={gexAdjustment === 'aggressive' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGexAdjustment('aggressive')}
                        className={gexAdjustment === 'aggressive' ? "bg-orange-600 hover:bg-orange-700" : ""}
                      >
                        Aggressive
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current GEX: {formatGEX(stockData.gex)} - {
                        stockData.gex > 500000 ? "bullish stability (reduce bearish position size)" :
                        stockData.gex < -500000 ? "bearish pressure (reduce bullish position size)" :
                        "near zero (potential breakout)"
                      }
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={handleCalculate}
                    className="w-full"
                  >
                    Calculate Position Size
                  </Button>
                </div>
              </div>
            </div>
            
            {calculationResult && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Calculation Results</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Position Size</h4>
                    <div className="text-2xl font-bold">
                      {calculationResult.contractsToTrade} {calculationResult.contractsToTrade === 1 ? 'contract' : 'contracts'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stockData.recommendation.action} at ${stockData.recommendation.strike}
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Maximum Risk</h4>
                    <div className="text-2xl font-bold text-red-600">
                      ${calculationResult.maxRisk.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(calculationResult.adjustedRisk).toFixed(2)}% of account
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Potential Profit</h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${calculationResult.potentialProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculationResult.profitPercentage.toFixed(2)}% return on account
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <div className="flex items-start gap-2">
                    <BarChart className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-medium">Risk/Reward Ratio: {calculationResult.riskRatio.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {calculationResult.riskRatio >= 2 ? 
                          "Excellent risk/reward profile (2:1 or better)." :
                          calculationResult.riskRatio >= 1.5 ?
                          "Good risk/reward profile (1.5:1)." :
                          "Moderate risk/reward profile. Consider adjusting entry or targets."
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {calculationResult.riskRatio < 1.5 && (
                  <div className="mt-3 rounded-lg bg-amber-100 dark:bg-amber-950 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">Risk Warning</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                          The risk/reward ratio is below recommended levels. Consider reducing position size, 
                          adjusting entry price, or selecting a different strike to improve the trade profile.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="guidelines" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Position Sizing Guidelines</h3>
              
              <div className="space-y-3 text-sm">
                <p>
                  Effective position sizing is critical for managing risk in options trading. The following guidelines 
                  will help you determine appropriate position sizes based on market conditions:
                </p>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Risk Percentage by Implied Volatility:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Low IV (&lt;30%): 1.0-2.0% of account</li>
                    <li>Moderate IV (30-50%): 0.5-1.5% of account</li>
                    <li>High IV (&gt;50%): 0.5-1.0% of account</li>
                    <li>Extreme IV (&gt;80%): 0.25-0.5% of account</li>
                  </ul>
                </div>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Position Size Adjustments for GEX:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Strong Positive GEX (&gt;$1B): Reduce bearish position sizes by 20-30%</li>
                    <li>Strong Negative GEX (&lt;-$1B): Reduce bullish position sizes by 20-30%</li>
                    <li>Near-zero GEX (&lt;$200M): Potential breakout, maintain normal position sizing</li>
                  </ul>
                </div>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Risk/Reward Requirements:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Minimum: 1.5:1 (potential profit should be at least 1.5× the risk)</li>
                    <li>Optimal: 2:1 or greater</li>
                    <li>High-Probability Trades: 1:1 acceptable (e.g., high delta options with 70%+ probability)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Stop Loss Strategies</h3>
              
              <div className="space-y-3 text-sm">
                <p>
                  Implementing effective stop losses is essential for preserving capital. Consider these approaches:
                </p>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Technical Level Stops:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Support/Resistance Breaks: Exit when price breaks key level</li>
                    <li>Moving Average Violations: Exit when price breaks below relevant EMA</li>
                    <li>Chart Pattern Invalidation: Exit when pattern fails (e.g., trendline break)</li>
                  </ul>
                </div>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Percentage-Based Stops:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fixed Percentage: Exit at predetermined loss percentage (e.g., 50% of option value)</li>
                    <li>Volatility-Adjusted: Exit based on ATR or IV (wider stops in higher volatility)</li>
                    <li>Account-Based: Exit when loss reaches maximum risk percentage of account</li>
                  </ul>
                </div>
                
                <div className="space-y-1 mt-2">
                  <p className="font-medium">Time-Based Stops:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Maximum Days: Exit if trade hasn't reached profit target within X days</li>
                    <li>Delta Decay: Exit when delta decays below predetermined threshold</li>
                    <li>Theta Acceleration: Exit when theta decay accelerates beyond tolerance</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Risk Management Principles</h3>
              
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">1. Never Risk More Than You Can Afford to Lose</p>
                  <p className="text-muted-foreground">
                    Limit total portfolio risk to prevent catastrophic losses. Keep total position risk
                    across all open trades below 15-20% of your portfolio.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">2. Correlation Risk</p>
                  <p className="text-muted-foreground">
                    Be aware of correlations between positions. Multiple trades in the same sector or
                    with similar market drivers increase overall portfolio risk.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">3. Volatility Adjustment</p>
                  <p className="text-muted-foreground">
                    Reduce position sizes during high volatility periods. Higher IV environments require
                    smaller positions due to increased premium costs and potential for larger swings.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">4. Scale In/Out</p>
                  <p className="text-muted-foreground">
                    Consider entering and exiting positions in stages rather than all at once. This approach
                    can reduce timing risk and often results in better average entry/exit prices.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">5. Set Predefined Targets</p>
                  <p className="text-muted-foreground">
                    Always establish profit targets and stop losses before entering a trade. Having a clear
                    plan helps remove emotional decision-making during market fluctuations.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate estimated option premium
function calculateEstimatedPremium(price: number, iv: number, setupType: string): number {
  // This is a simplified model for estimation
  // In a real implementation, this would use the Black-Scholes model with proper parameters
  
  // Base premium as percentage of stock price based on IV
  let premiumPercentage = iv / 100;
  
  // Adjust for at-the-money options (roughly 5-15% of stock price for moderate IV)
  if (iv < 30) {
    premiumPercentage = 0.05 + (iv / 100) * 0.3;
  } else if (iv < 50) {
    premiumPercentage = 0.08 + (iv / 100) * 0.4;
  } else {
    premiumPercentage = 0.12 + (iv / 100) * 0.5;
  }
  
  // Calculate base premium
  let premium = price * premiumPercentage;
  
  // Round to nearest $0.05
  premium = Math.round(premium * 20) / 20;
  
  return premium;
}

// Helper function to calculate potential profit
function calculatePotentialProfit(
  price: number,
  strike: number,
  premium: number,
  setupType: string
): number {
  // This is a simplified model for profit estimation
  // In a real implementation, this would use proper options pricing models
  
  if (setupType === 'bullish') {
    // For calls, estimate profit at target price
    const targetPrice = typeof strike === 'number' ? strike : price * 1.1;
    return Math.max(0, (targetPrice - price) - premium) * 100; // Per contract (100 shares)
  } else if (setupType === 'bearish') {
    // For puts, estimate profit at target price
    const targetPrice = typeof strike === 'number' ? strike : price * 0.9;
    return Math.max(0, (price - targetPrice) - premium) * 100; // Per contract (100 shares)
  } else {
    // For neutral (iron condors, etc.), estimate profit as 50% of premium
    return premium * 0.5 * 100; // Per contract (100 shares)
  }
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