"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "../ui/sonner";
import { 
  AlertTriangle, 
  ArrowDown, 
  ArrowDownRight, 
  ArrowRight, 
  ArrowUp,
  ArrowRightLeft,
  BarChart4,
  CheckCircle, 
  DollarSign, 
  PieChart, 
  RefreshCw, 
  Scale,
  Target,
  Coins
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface RiskRewardResult {
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  winProbability: number;
  expectedValue: number;
  dollarRisk: number;
  dollarReward: number;
  adjustedRiskRewardRatio: number;
  riskScore: number;
  recommendations: string[];
  tradeQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface RiskRewardAnalysisProps {
  symbol: string;
  stockData: {
    price: number;
    setupType: string;
    iv: number;
    recommendation: {
      action: string;
      target: number | string;
      stop: number | string;
      expiration: string;
      strike: number;
    };
  };
}

export function RiskRewardAnalysis({ symbol, stockData }: RiskRewardAnalysisProps) {
  // State for form inputs
  const [entryPrice, setEntryPrice] = useState<number>(stockData.price);
  const [targetPrice, setTargetPrice] = useState<number>(
    typeof stockData.recommendation.target === 'number' 
      ? stockData.recommendation.target 
      : stockData.price * 1.1
  );
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    typeof stockData.recommendation.stop === 'number' 
      ? stockData.recommendation.stop 
      : stockData.price * 0.95
  );
  const [positionType, setPositionType] = useState<'long' | 'short' | 'call' | 'put' | 'spread' | 'condor'>(
    stockData.setupType === 'bullish' ? 'call' : 
    stockData.setupType === 'bearish' ? 'put' : 'spread'
  );
  const [investmentAmount, setInvestmentAmount] = useState<number>(5000);
  const [optionPremium, setOptionPremium] = useState<number>(3.5);
  const [strike, setStrike] = useState<number>(
    stockData.recommendation.strike || Math.round(stockData.price)
  );
  const [daysToExpiration, setDaysToExpiration] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const [winProbability, setWinProbability] = useState<number | null>(null);
  
  // State for calculation results
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [riskRewardResult, setRiskRewardResult] = useState<RiskRewardResult | null>(null);
  
  // Function to calculate risk/reward
  const calculateRiskReward = async () => {
    try {
      setIsCalculating(true);
      
      // Validate inputs
      if (entryPrice <= 0) {
        toast.error("Entry price must be greater than zero");
        return;
      }
      
      if (targetPrice === entryPrice) {
        toast.error("Target price must be different from entry price");
        return;
      }
      
      if (stopLossPrice === entryPrice) {
        toast.error("Stop loss price must be different from entry price");
        return;
      }
      
      // Construct request body
      const requestBody: any = {
        entryPrice,
        targetPrice,
        stopLossPrice,
        positionType,
        iv: stockData.iv,
        investmentAmount,
        quantity
      };
      
      // Add position type specific fields
      if (positionType === 'call' || positionType === 'put' || positionType === 'spread' || positionType === 'condor') {
        requestBody.optionPremium = optionPremium;
        requestBody.strike = strike;
        requestBody.daysToExpiration = daysToExpiration;
      }
      
      // Add win probability if manually specified
      if (winProbability !== null) {
        requestBody.winProbability = winProbability;
      }
      
      // Make API request
      const response = await fetch('/api/risk-reward-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate risk/reward analysis');
      }
      
      const data = await response.json();
      setRiskRewardResult(data);
      toast.success("Risk/reward analysis calculated");
      
    } catch (error) {
      console.error("Error calculating risk/reward analysis:", error);
      toast.error(error instanceof Error ? error.message : "Failed to calculate risk/reward analysis");
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Function to get score color class
  const getScoreColorClass = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-blue-600";
    if (score >= 3) return "text-amber-600";
    return "text-red-600";
  };
  
  // Function to get quality badge variant
  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case 'excellent': return "bg-green-600";
      case 'good': return "bg-blue-600";
      case 'fair': return "bg-amber-600";
      case 'poor': return "bg-red-600";
      default: return "";
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Risk/Reward Analysis for {symbol}</CardTitle>
        <CardDescription>
          Evaluate trade opportunities by analyzing risk/reward ratios and expected value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calculator">Risk/Reward Calculator</TabsTrigger>
            <TabsTrigger value="guidelines">Risk/Reward Guidelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Trade Parameters</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="position-type">Position Type</Label>
                    <Select 
                      value={positionType}
                      onValueChange={(value) => setPositionType(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Stock (Long)</SelectItem>
                        <SelectItem value="short">Stock (Short)</SelectItem>
                        <SelectItem value="call">Call Option</SelectItem>
                        <SelectItem value="put">Put Option</SelectItem>
                        <SelectItem value="spread">Option Spread</SelectItem>
                        <SelectItem value="condor">Iron Condor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="entry-price">Entry Price ($)</Label>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                      <Input 
                        id="entry-price"
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                        placeholder="100.00"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-price">Target Price ($)</Label>
                    <div className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-muted-foreground" />
                      <Input 
                        id="target-price"
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                        placeholder="110.00"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss-price">Stop Loss Price ($)</Label>
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-muted-foreground" />
                      <Input 
                        id="stop-loss-price"
                        type="number"
                        value={stopLossPrice}
                        onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                        placeholder="90.00"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  {(positionType === 'long' || positionType === 'short') && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity (Shares)</Label>
                      <div className="flex items-center">
                        <Coins className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Input 
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                          placeholder="100"
                          min="1"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(positionType === 'call' || positionType === 'put' || positionType === 'spread' || positionType === 'condor') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="option-premium">Option Premium ($)</Label>
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                          <Input 
                            id="option-premium"
                            type="number"
                            value={optionPremium}
                            onChange={(e) => setOptionPremium(parseFloat(e.target.value) || 0)}
                            placeholder="3.50"
                            min="0.01"
                            step="0.05"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Premium per contract (price x 100 for total value)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="strike">Strike Price ($)</Label>
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                          <Input 
                            id="strike"
                            type="number"
                            value={strike}
                            onChange={(e) => setStrike(parseFloat(e.target.value) || 0)}
                            placeholder="100.00"
                            min="0.01"
                            step="0.5"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="days-expiration">Days to Expiration</Label>
                        <Input 
                          id="days-expiration"
                          type="number"
                          value={daysToExpiration}
                          onChange={(e) => setDaysToExpiration(parseInt(e.target.value) || 0)}
                          placeholder="30"
                          min="1"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contracts">Number of Contracts</Label>
                        <div className="flex items-center">
                          <Coins className="h-5 w-5 mr-2 text-muted-foreground" />
                          <Input 
                            id="contracts"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            placeholder="1"
                            min="1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="win-probability">Win Probability (%) (Optional)</Label>
                      <span className="text-sm text-muted-foreground">
                        {winProbability !== null ? `${winProbability}%` : 'Auto-calculate'}
                      </span>
                    </div>
                    <Slider
                      id="win-probability"
                      min={10}
                      max={90}
                      step={5}
                      value={winProbability !== null ? [winProbability] : [50]}
                      onValueChange={(value) => setWinProbability(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (25%)</span>
                      <span>Average (50%)</span>
                      <span>High (75%)</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-1 w-full"
                      onClick={() => setWinProbability(null)}
                    >
                      Reset to Auto-Calculate
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={calculateRiskReward}
                    className="w-full"
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'Calculate Risk/Reward'
                    )}
                  </Button>
                </div>
              </div>
              
              {riskRewardResult ? (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="text-lg font-semibold mb-3">Risk/Reward Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Risk/Reward Ratio</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        1:{riskRewardResult.riskRewardRatio.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Potential reward vs. risk
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Expected Value</h4>
                      <div className={`text-2xl font-bold ${riskRewardResult.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${riskRewardResult.expectedValue.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mathematical expectation
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Win Probability</h4>
                      <div className="text-2xl font-bold">
                        {riskRewardResult.winProbability}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated chance of success
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Trade Quality</h4>
                      <div className="flex items-center">
                        <Badge 
                          className={getQualityBadgeVariant(riskRewardResult.tradeQuality)}
                        >
                          {riskRewardResult.tradeQuality.toUpperCase()}
                        </Badge>
                        <span className="ml-2 text-xl font-bold">
                          {riskRewardResult.riskScore.toFixed(1)}/10
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Overall trade score
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Potential Loss</h4>
                      <div className="text-xl font-bold text-red-600">
                        -${riskRewardResult.dollarRisk.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum risk amount
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Potential Gain</h4>
                      <div className="text-xl font-bold text-green-600">
                        +${riskRewardResult.dollarReward.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum reward amount
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Recommendations</h4>
                    <div className="rounded-lg bg-muted p-3">
                      <ul className="space-y-2">
                        {riskRewardResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            {recommendation.includes('Warning') ? (
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            )}
                            <span className={recommendation.includes('Warning') ? 'text-amber-700 dark:text-amber-300' : ''}>
                              {recommendation}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {riskRewardResult.expectedValue <= 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Negative Expected Value</AlertTitle>
                        <AlertDescription>
                          This trade has a negative mathematical expectation of ${riskRewardResult.expectedValue.toFixed(2)}.
                          Consider adjusting your entry, target, or stop loss to improve the risk/reward profile.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col items-center justify-center text-center">
                  <div className="p-4">
                    <ArrowRightLeft className="h-12 w-12 mb-4 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">Risk/Reward Analysis</h3>
                    <p className="text-muted-foreground">
                      Fill in the trade parameters and click "Calculate Risk/Reward" to analyze your trade setup
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="guidelines" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Risk/Reward Guidelines</h3>
              
              <div className="space-y-5 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-500" />
                    Risk/Reward Ratio Interpretation
                  </h4>
                  <p className="text-muted-foreground">
                    The risk/reward ratio compares potential profit to potential loss. A higher ratio indicates
                    more attractive trade opportunities. Professional traders typically look for ratios of at least 1:2 (or higher).
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium text-red-600">Below 1:1</p>
                      <p className="text-xs">Risk exceeds reward. Generally avoid these trades unless win probability is extremely high.</p>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium text-amber-600">1:1 to 1:2</p>
                      <p className="text-xs">Acceptable, but not ideal. Requires higher win rate to be profitable long-term.</p>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium text-green-600">Above 1:3</p>
                      <p className="text-xs">Excellent. Can be profitable even with lower win rates. These are the trades to focus on.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart4 className="h-4 w-4 text-purple-500" />
                    Expected Value Analysis
                  </h4>
                  <p className="text-muted-foreground">
                    Expected value combines risk/reward ratio with win probability to determine mathematical expectation over time.
                    Positive expected value trades are mathematically profitable in the long run.
                  </p>
                  <div className="rounded bg-muted/50 p-2 mt-2">
                    <p className="text-xs font-medium">Expected Value Formula:</p>
                    <p className="text-xs mt-1">
                      EV = (Reward × Win Probability) - (Risk × Loss Probability)
                    </p>
                    <p className="text-xs mt-1">
                      Example: $500 potential profit with 40% win rate vs $250 risk with 60% loss rate
                      <br />
                      EV = ($500 × 0.4) - ($250 × 0.6) = $200 - $150 = +$50
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-green-500" />
                    Win Probability Factors
                  </h4>
                  <p className="text-muted-foreground">
                    Win probability estimates the likelihood of a trade reaching its target before hitting the stop loss.
                    It's influenced by various factors including market conditions, technical setup, and option characteristics.
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Options-Specific Factors:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Distance from strike (further OTM = lower probability)</li>
                        <li>Implied volatility (higher IV = wider price swings)</li>
                        <li>Time to expiration (less time = lower probability)</li>
                        <li>Option Greeks (delta approximates probability)</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Stock/ETF Factors:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Technical pattern completion rate</li>
                        <li>Trend strength and market conditions</li>
                        <li>Distance to support/resistance levels</li>
                        <li>Historical volatility and price behavior</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Trading Best Practices</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Focus on trade quality, not quantity</p>
                    <p className="text-sm text-muted-foreground">
                      Seek trades with high risk/reward ratios and positive expected value rather than frequent trading.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Use asymmetric risk/reward opportunities</p>
                    <p className="text-sm text-muted-foreground">
                      The most profitable traders focus on asymmetric opportunities with potential rewards significantly 
                      higher than potential risks (3:1 or greater).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Manage position sizing based on risk/reward</p>
                    <p className="text-sm text-muted-foreground">
                      Adjust position sizes based on the quality of the setup—larger positions for better risk/reward ratios,
                      smaller positions for less favorable ratios.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Set realistic profit targets</p>
                    <p className="text-sm text-muted-foreground">
                      Set profit targets at logical levels (resistance, support, prior highs/lows) rather than arbitrary prices.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowUp className="h-4 w-4 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-medium">Avoid these common mistakes</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                      <li>Setting profit targets too far away (unrealistic)</li>
                      <li>Setting stop losses too tight (getting stopped out prematurely)</li>
                      <li>Ignoring expected value in trade selection</li>
                      <li>Overtrading low-quality setups with poor risk/reward</li>
                      <li>Failing to adjust position size based on trade quality</li>
                    </ul>
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