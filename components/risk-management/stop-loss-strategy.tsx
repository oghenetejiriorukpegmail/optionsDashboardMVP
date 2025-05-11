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
import { AlertTriangle, ArrowDown, ArrowDownRight, ArrowRight, ArrowUp, CheckCircle, DollarSign, PieChart, RefreshCw, Timer, Waves } from "lucide-react";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface StopLossResult {
  stopLossPrice: number | null;
  stopLossAmount: number | null;
  maxLoss: number | null;
  riskDescription: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  additionalRecommendations: string[];
  stopLossPercentage: string | null;
}

interface StopLossStrategyProps {
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

export function StopLossStrategy({ symbol, stockData }: StopLossStrategyProps) {
  // State for form inputs
  const [entryPrice, setEntryPrice] = useState<number>(stockData.price);
  const [tradeType, setTradeType] = useState<'stock' | 'call' | 'put' | 'spread'>(
    stockData.setupType === 'bullish' ? 'call' : 
    stockData.setupType === 'bearish' ? 'put' : 'spread'
  );
  const [stopType, setStopType] = useState<'technical' | 'percentage' | 'atr' | 'fixed' | 'time'>('technical');
  const [optionPremium, setOptionPremium] = useState<number>(2.5);
  const [daysToExpiration, setDaysToExpiration] = useState<number>(30);
  const [technicalLevel, setTechnicalLevel] = useState<number>(
    stockData.setupType === 'bullish' ? stockData.price * 0.95 : 
    stockData.setupType === 'bearish' ? stockData.price * 1.05 : 
    stockData.price * 0.95
  );
  const [percentageValue, setPercentageValue] = useState<number>(50);
  const [atrValue, setAtrValue] = useState<number>(stockData.price * 0.02); // Roughly 2% of price
  const [fixedDollarAmount, setFixedDollarAmount] = useState<number>(200);
  const [timeDays, setTimeDays] = useState<number>(7);
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  
  // State for calculation results
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [stopLossResult, setStopLossResult] = useState<StopLossResult | null>(null);
  
  // Function to calculate stop loss
  const calculateStopLoss = async () => {
    try {
      setIsCalculating(true);
      
      // Validate inputs
      if (entryPrice <= 0) {
        toast.error("Entry price must be greater than zero");
        return;
      }
      
      // Construct request body based on stop type
      const requestBody: any = {
        entryPrice,
        tradeType,
        stopType,
        iv: stockData.iv,
        accountSize,
        riskPercentage
      };
      
      // Add stop type specific fields
      if (tradeType === 'call' || tradeType === 'put' || tradeType === 'spread') {
        requestBody.optionPremium = optionPremium;
        requestBody.daysToExpiration = daysToExpiration;
      }
      
      if (stopType === 'technical') {
        requestBody.technicalLevel = technicalLevel;
      } else if (stopType === 'percentage') {
        requestBody.percentageValue = percentageValue;
      } else if (stopType === 'atr') {
        requestBody.atrValue = atrValue;
      } else if (stopType === 'fixed') {
        requestBody.fixedDollarAmount = fixedDollarAmount;
      } else if (stopType === 'time') {
        requestBody.timeDays = timeDays;
      }
      
      // Make API request
      const response = await fetch('/api/stop-loss-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate stop loss');
      }
      
      const data = await response.json();
      setStopLossResult(data);
      toast.success("Stop loss strategy calculated");
      
    } catch (error) {
      console.error("Error calculating stop loss strategy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to calculate stop loss");
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stop Loss Strategy for {symbol}</CardTitle>
        <CardDescription>
          Create optimal stop loss strategies based on your trading style and risk tolerance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calculator">Stop Loss Calculator</TabsTrigger>
            <TabsTrigger value="guidelines">Stop Loss Guidelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Trade Parameters</h3>
                
                <div className="space-y-4">
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
                    <Label htmlFor="trade-type">Trade Type</Label>
                    <Select 
                      value={tradeType}
                      onValueChange={(value) => setTradeType(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trade type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Stock (Long/Short)</SelectItem>
                        <SelectItem value="call">Call Option</SelectItem>
                        <SelectItem value="put">Put Option</SelectItem>
                        <SelectItem value="spread">Option Spread</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(tradeType === 'call' || tradeType === 'put' || tradeType === 'spread') && (
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
                            placeholder="2.50"
                            min="0.01"
                            step="0.05"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Premium per contract (price x 100 for total value)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="days-expiration">Days to Expiration</Label>
                        <div className="flex items-center">
                          <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                          <Input 
                            id="days-expiration"
                            type="number"
                            value={daysToExpiration}
                            onChange={(e) => setDaysToExpiration(parseInt(e.target.value) || 0)}
                            placeholder="30"
                            min="1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
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
                      <Label htmlFor="risk-percentage">Max Risk Percentage</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Maximum risk: ${(accountSize * riskPercentage / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Stop Loss Method</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stop-type">Stop Loss Type</Label>
                    <Select 
                      value={stopType}
                      onValueChange={(value) => setStopType(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stop loss type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Level</SelectItem>
                        <SelectItem value="percentage">Percentage-Based</SelectItem>
                        <SelectItem value="atr">ATR-Based</SelectItem>
                        <SelectItem value="fixed">Fixed Dollar Amount</SelectItem>
                        <SelectItem value="time">Time-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Stop loss type specific inputs */}
                  {stopType === 'technical' && (
                    <div className="space-y-2">
                      <Label htmlFor="technical-level">Technical Level ($)</Label>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Input 
                          id="technical-level"
                          type="number"
                          value={technicalLevel}
                          onChange={(e) => setTechnicalLevel(parseFloat(e.target.value) || 0)}
                          placeholder={stockData.price.toString()}
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Key support/resistance level that would invalidate your thesis
                      </p>
                    </div>
                  )}
                  
                  {stopType === 'percentage' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="percentage-value">Percentage of {tradeType === 'stock' ? 'Entry Price' : 'Premium'}</Label>
                        <span className="text-sm text-muted-foreground">{percentageValue}%</span>
                      </div>
                      <Slider
                        id="percentage-value"
                        min={10}
                        max={100}
                        step={5}
                        value={[percentageValue]}
                        onValueChange={(value) => setPercentageValue(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tight (25%)</span>
                        <span>Moderate (50%)</span>
                        <span>Wide (75%)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tradeType === 'stock'
                          ? `Equivalent to $${(entryPrice * (percentageValue / 100)).toFixed(2)} stop loss`
                          : `Equivalent to $${(optionPremium * (percentageValue / 100)).toFixed(2)} loss per contract`}
                      </p>
                    </div>
                  )}
                  
                  {stopType === 'atr' && (
                    <div className="space-y-2">
                      <Label htmlFor="atr-value">Average True Range (ATR)</Label>
                      <div className="flex items-center">
                        <Waves className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Input 
                          id="atr-value"
                          type="number"
                          value={atrValue}
                          onChange={(e) => setAtrValue(parseFloat(e.target.value) || 0)}
                          placeholder="3.50"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Typical ATR for this stock is approximately ${(stockData.price * 0.02).toFixed(2)} (2% of price)
                      </p>
                    </div>
                  )}
                  
                  {stopType === 'fixed' && (
                    <div className="space-y-2">
                      <Label htmlFor="fixed-amount">Fixed Dollar Amount ($)</Label>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Input 
                          id="fixed-amount"
                          type="number"
                          value={fixedDollarAmount}
                          onChange={(e) => setFixedDollarAmount(parseFloat(e.target.value) || 0)}
                          placeholder="200"
                          min="1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This is your maximum loss amount for the entire position
                      </p>
                    </div>
                  )}
                  
                  {stopType === 'time' && (
                    <div className="space-y-2">
                      <Label htmlFor="time-days">Maximum Days in Trade</Label>
                      <div className="flex items-center">
                        <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Input 
                          id="time-days"
                          type="number"
                          value={timeDays}
                          onChange={(e) => setTimeDays(parseInt(e.target.value) || 0)}
                          placeholder="7"
                          min="1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exit the trade if your target isn't reached within this timeframe
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={calculateStopLoss}
                    className="w-full"
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'Calculate Stop Loss'
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {stopLossResult && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Stop Loss Results</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Stop Loss Level</h4>
                    <div className="text-2xl font-bold">
                      {stopLossResult.stopLossPrice ? 
                        `$${stopLossResult.stopLossPrice.toFixed(2)}` : 
                        'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stopType === 'technical' ? 'Technical level stop' : 
                       stopType === 'percentage' ? `${percentageValue}% stop` :
                       stopType === 'atr' ? 'Volatility-based stop' :
                       stopType === 'fixed' ? 'Fixed dollar amount' :
                       'Time-based exit'}
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Maximum Risk</h4>
                    <div className="text-2xl font-bold text-red-600">
                      ${stopLossResult.stopLossAmount?.toFixed(2) || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stopLossResult.stopLossPercentage ? 
                        `${stopLossResult.stopLossPercentage}% of position` : 
                        'Based on stop level'}
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">Confidence Level</h4>
                    <div className="flex items-center">
                      <Badge 
                        variant={
                          stopLossResult.confidenceLevel === 'high' ? 'default' :
                          stopLossResult.confidenceLevel === 'medium' ? 'secondary' :
                          'outline'
                        }
                        className={
                          stopLossResult.confidenceLevel === 'high' ? 'bg-green-600' :
                          stopLossResult.confidenceLevel === 'medium' ? 'bg-blue-600' :
                          ''
                        }
                      >
                        {stopLossResult.confidenceLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on stop type and market conditions
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-start gap-2">
                      <PieChart className="h-5 w-5 mt-0.5 text-blue-500" />
                      <div>
                        <p className="font-medium">Stop Loss Analysis</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stopLossResult.riskDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {stopLossResult.additionalRecommendations.length > 0 && (
                    <div className="rounded-lg bg-muted p-3">
                      <h4 className="text-sm font-medium mb-1">Recommendations</h4>
                      <ul className="space-y-1 mt-2">
                        {stopLossResult.additionalRecommendations.map((recommendation, index) => (
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
                  )}
                  
                  {stopLossResult.maxLoss && stopLossResult.stopLossAmount && 
                   stopLossResult.stopLossAmount > stopLossResult.maxLoss && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Risk Warning</AlertTitle>
                      <AlertDescription>
                        This stop loss ($
                        {stopLossResult.stopLossAmount.toFixed(2)}) exceeds your maximum risk tolerance of $
                        {stopLossResult.maxLoss.toFixed(2)} ({riskPercentage}% of account).
                        Consider reducing position size or adjusting your stop loss strategy.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="guidelines" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Stop Loss Strategy Guidelines</h3>
              
              <div className="space-y-5 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                    Technical Stop Losses
                  </h4>
                  <p className="text-muted-foreground">
                    Technical stops are placed at key support/resistance levels, trend lines, or moving averages 
                    that would invalidate your trade thesis if broken. These are often the most effective stops
                    as they're based on the market's natural structure.
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Best for:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Swing trading based on chart patterns</li>
                        <li>Trades with clear technical invalidation points</li>
                        <li>Trading around key market levels</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Effectiveness:</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="ml-2 text-xs">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-amber-500" />
                    Percentage-Based Stops
                  </h4>
                  <p className="text-muted-foreground">
                    Percentage stops exit a position when it moves against you by a predetermined percentage.
                    For options, this is typically based on premium paid (e.g., 50% of premium). For stocks,
                    it's based on the entry price (e.g., 5% below entry).
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Best for:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Options trading (50% of premium rule)</li>
                        <li>Systematic trading approaches</li>
                        <li>Trades without clear technical levels</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Effectiveness:</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="ml-2 text-xs">75%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Waves className="h-4 w-4 text-blue-500" />
                    ATR-Based Stops
                  </h4>
                  <p className="text-muted-foreground">
                    Average True Range (ATR) stops adapt to market volatility, placing stops wider in volatile
                    markets and tighter in calm markets. Typically set at 2-3× the ATR value below your entry
                    for long positions or above for shorts.
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Best for:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Volatile markets or stocks</li>
                        <li>Trading across different market conditions</li>
                        <li>Position trading longer timeframes</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Effectiveness:</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                        <span className="ml-2 text-xs">80%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Fixed Dollar Stops
                  </h4>
                  <p className="text-muted-foreground">
                    Fixed dollar stops limit your loss to a specific dollar amount regardless of percentage
                    or price movement. This approach helps manage position sizing for consistent risk across trades.
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Best for:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Account management focus</li>
                        <li>Professional trading approaches</li>
                        <li>Trading across different asset classes</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Effectiveness:</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="ml-2 text-xs">70%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4 text-purple-500" />
                    Time-Based Stops
                  </h4>
                  <p className="text-muted-foreground">
                    Time-based stops exit a trade if it hasn't reached your target within a specific timeframe.
                    This limits opportunity cost and prevents theta decay for options. Often combined with
                    price-based stops for optimal protection.
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Best for:</p>
                      <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                        <li>Options trades (due to theta decay)</li>
                        <li>Event-driven strategies</li>
                        <li>Opportunity cost management</li>
                      </ul>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <p className="text-xs font-medium">Effectiveness:</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="ml-2 text-xs">60%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Best Practices</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Always set stops before entering a trade</p>
                    <p className="text-sm text-muted-foreground">
                      Determine your stop loss point before taking a position to remove emotion from the exit decision.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Consider multiple stop approaches</p>
                    <p className="text-sm text-muted-foreground">
                      The most robust strategy often combines technical, volatility-based (ATR), and time-based stops.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Adjust stops with changing conditions</p>
                    <p className="text-sm text-muted-foreground">
                      As the trade moves in your favor, consider trailing stops to lock in gains while allowing for continued profit potential.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-medium">Scale out of positions</p>
                    <p className="text-sm text-muted-foreground">
                      Consider taking partial profits at different levels while maintaining your stop on the remaining position.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowUp className="h-4 w-4 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-medium">Avoid these common mistakes</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                      <li>Setting stops too tight in volatile markets</li>
                      <li>Ignoring technical levels when placing stops</li>
                      <li>Moving stops to avoid losses (breaking discipline)</li>
                      <li>Not considering overall market conditions</li>
                      <li>Setting and forgetting without adjustment</li>
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