"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Book,
  BarChart3,
  Target,
  CheckCircle,
  Calculator,
  LineChart,
  Search,
  ArrowRight,
  BarChart,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  HelpCircle,
  Lightbulb,
  FileText,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Documentation sections
const documentationSections = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: <BookOpen className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Welcome to the Options-Technical Hybrid Dashboard</h2>
        <p className="mb-4">
          This dashboard combines options analytics with technical analysis to identify high-probability trading opportunities in the market. The platform is designed for options traders who want to incorporate both technical and options data into their trading decisions.
        </p>
        <p className="mb-4">
          The Options-Technical Hybrid strategy looks for setups where the technical analysis (price action, momentum, trend) aligns with the options market sentiment (implied volatility, open interest, put-call ratio) to identify potential trade opportunities.
        </p>
        <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Key Features
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Real-time market context analysis with technical indicators and options sentiment</li>
            <li>Trade setup rules for bullish, bearish, and neutral market conditions</li>
            <li>Confirmation criteria to validate potential trade entries and exits</li>
            <li>Position sizing calculator based on account risk and volatility</li>
            <li>Key levels visualization using options chain data and technical support/resistance</li>
            <li>Advanced scanner with filtering capabilities for options-technical hybrid setups</li>
            <li>Backtesting module to validate strategy performance on historical data</li>
          </ul>
        </div>
        <h3 className="text-xl font-bold mb-2">Getting Started</h3>
        <p className="mb-4">
          To get the most out of this dashboard, we recommend following this workflow:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Begin by checking the <strong>Market Context</strong> to understand the current market sentiment</li>
          <li>Review the <strong>Trade Setup Rules</strong> to identify potential trade opportunities</li>
          <li>Use the <strong>Scanner</strong> to find specific tickers matching your criteria</li>
          <li>Confirm setups with the <strong>Confirmation</strong> module</li>
          <li>Use the <strong>Risk Management</strong> calculator to determine position sizing</li>
          <li>Identify key price levels using the <strong>Key Levels</strong> visualization</li>
        </ol>
        <p>
          Each module is designed to work together as part of an integrated workflow, but they can also be used independently based on your specific needs.
        </p>
      </>
    )
  },
  {
    id: 'market-context',
    title: 'Market Context',
    icon: <BarChart3 className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Market Context Dashboard</h2>
        <p className="mb-4">
          The Market Context Dashboard provides a comprehensive view of market conditions by combining technical analysis and options market sentiment.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Components</h3>
        <div className="space-y-4 mb-6">
          <div className="border rounded-md p-4">
            <h4 className="text-lg font-semibold mb-2">Trend Analysis</h4>
            <p className="mb-2">
              Analyzes price action using multiple exponential moving averages (EMAs) to determine the current trend.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Strong Bullish:</strong> EMA 10 &gt; EMA 20 &gt; EMA 50 with strong momentum</li>
              <li><strong>Bullish:</strong> EMA 10 &gt; EMA 20 &gt; EMA 50</li>
              <li><strong>Transitioning:</strong> EMAs are crossing or close to crossing</li>
              <li><strong>Bearish:</strong> EMA 10 &lt; EMA 20 &lt; EMA 50</li>
              <li><strong>Strong Bearish:</strong> EMA 10 &lt; EMA 20 &lt; EMA 50 with strong downward momentum</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-4">
            <h4 className="text-lg font-semibold mb-2">Momentum Analysis</h4>
            <p className="mb-2">
              Uses RSI and Stochastic RSI to gauge momentum and potential reversals.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>RSI:</strong> Relative Strength Index measures the magnitude of recent price changes</li>
              <li><strong>Stochastic RSI:</strong> Applies the stochastic oscillator formula to RSI values</li>
              <li><strong>Overbought/Oversold:</strong> Identifies extreme conditions that might lead to reversals</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-4">
            <h4 className="text-lg font-semibold mb-2">Options Sentiment</h4>
            <p className="mb-2">
              Analyzes options market data to understand market sentiment and expectations.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Put-Call Ratio (PCR):</strong> Ratio of put volume/OI to call volume/OI</li>
              <li><strong>IV Percentile:</strong> Current implied volatility relative to its historical range</li>
              <li><strong>Gamma Exposure:</strong> Aggregate gamma across all options strikes</li>
              <li><strong>Max Pain:</strong> Price point where options holders lose the most money</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Select a ticker from the dropdown menu at the top of the page</li>
          <li>Review the Market Summary section for a quick overview of current conditions</li>
          <li>Examine the Trend Analysis to understand the current price trend</li>
          <li>Check Momentum Analysis for potential reversal signals</li>
          <li>Review Options Sentiment to understand what options traders are expecting</li>
          <li>Use the Trading Implications section to guide potential trade decisions</li>
        </ol>
        
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            Tips for Market Context Analysis
          </h3>
          <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
            <li>Look for alignment between technical indicators and options sentiment</li>
            <li>Pay attention to divergences between price action and options activity</li>
            <li>Use the Market Summary as a starting point, then dive deeper into specific metrics</li>
            <li>Monitor changes in sentiment over time for potential trend shifts</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'trade-setup',
    title: 'Trade Setups',
    icon: <Target className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Trade Setup Rules</h2>
        <p className="mb-4">
          The Trade Setup component provides a systematic approach to identifying potential trade opportunities based on predefined rules for bullish, bearish, and neutral market conditions.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Setup Types</h3>
        <div className="space-y-4 mb-6">
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h4 className="text-lg font-semibold mb-2">Bullish Setup</h4>
            <p className="mb-2">
              A bullish setup occurs when technical and options indicators suggest potential upward price movement.
            </p>
            <h5 className="font-medium mb-1">Key Criteria:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>EMA Trend: EMA 10 &gt; EMA 20 &gt; EMA 50</li>
              <li>RSI: Above 55, preferably below 80</li>
              <li>Stochastic RSI: Above 50, preferably with recent cross upward</li>
              <li>PCR: Below typical levels (varies by IV environment)</li>
              <li>Gamma Exposure: Positive</li>
              <li>Price near support: Within 2% of EMA 10</li>
              <li>Options Confirmation: High call open interest above current price</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4 py-2">
            <h4 className="text-lg font-semibold mb-2">Bearish Setup</h4>
            <p className="mb-2">
              A bearish setup occurs when technical and options indicators suggest potential downward price movement.
            </p>
            <h5 className="font-medium mb-1">Key Criteria:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>EMA Trend: EMA 10 &lt; EMA 20 &lt; EMA 50</li>
              <li>RSI: Below 45, preferably above 20</li>
              <li>Stochastic RSI: Below 50, preferably with recent cross downward</li>
              <li>PCR: Above typical levels (varies by IV environment)</li>
              <li>Gamma Exposure: Negative</li>
              <li>Price near resistance: Within 2% of EMA 10</li>
              <li>Options Confirmation: High put open interest below current price</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <h4 className="text-lg font-semibold mb-2">Neutral Setup</h4>
            <p className="mb-2">
              A neutral setup occurs when technical and options indicators suggest a potential range-bound or low-volatility environment.
            </p>
            <h5 className="font-medium mb-1">Key Criteria:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>EMA Trend: EMAs within 1% of each other (flat)</li>
              <li>RSI: Between 45-65 (middle range)</li>
              <li>Stochastic RSI: Between 25-75</li>
              <li>PCR: Between 0.8-1.2 (balanced)</li>
              <li>IV Percentile: Low (&lt; 40)</li>
              <li>Price near max pain: Within 2% of max pain price</li>
              <li>Options Confirmation: High gamma around current price (pinning)</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Trade Setup Component</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Select a ticker from the dropdown menu</li>
          <li>The system will automatically evaluate the current market conditions against the predefined rules</li>
          <li>Review the setup type with the highest match percentage</li>
          <li>Expand the details to see which specific criteria are being met</li>
          <li>Use the setup strength indicator to gauge the quality of the setup</li>
          <li>Consider setups with strength above 70% for potential trades</li>
        </ol>
        
        <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Best Practices
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Look for setups with high strength scores (&gt;70%)</li>
            <li>Prioritize setups where both technical and options criteria align</li>
            <li>Use the setup identification as the first step, followed by confirmation and risk management</li>
            <li>Monitor setups that are close to meeting criteria for potential future opportunities</li>
            <li>Consider the overall market context when evaluating individual ticker setups</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    icon: <CheckCircle className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Confirmation Component</h2>
        <p className="mb-4">
          The Confirmation component helps validate potential trade setups by providing additional signals and criteria for both entry and exit points. It acts as a second layer of analysis to increase the probability of successful trades.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Entry Confirmation Signals</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Technical Confirmation</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Stochastic RSI Hook:</strong> Stochastic RSI changes direction, confirming momentum shift</li>
              <li><strong>Volume Spike:</strong> Significant increase in volume supporting price movement</li>
              <li><strong>Price Action:</strong> Candle patterns confirming the setup (e.g., engulfing, hammer)</li>
              <li><strong>MACD Crossover:</strong> MACD line crosses signal line in direction of setup</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Options Confirmation</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>OI Change:</strong> Significant increase in call/put open interest supporting the setup</li>
              <li><strong>Options Flow:</strong> Unusual options activity in direction of the setup</li>
              <li><strong>IV Movement:</strong> Changes in implied volatility supporting the setup</li>
              <li><strong>Gamma Concentration:</strong> High gamma at specific strike prices indicating key levels</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Market Context Confirmation</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Sector Performance:</strong> Related sector/industry showing similar patterns</li>
              <li><strong>Market Breadth:</strong> Overall market strength/weakness supporting the setup</li>
              <li><strong>Correlation:</strong> Behavior relative to correlated assets or indices</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Exit Confirmation Signals</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Technical Exit Signals</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>RSI Divergence:</strong> Price making new high/low but RSI is not</li>
              <li><strong>Trend Break:</strong> Price breaks below/above key moving average</li>
              <li><strong>Volume Decline:</strong> Decreasing volume on price extension</li>
              <li><strong>Pattern Completion:</strong> Completion of measured move or pattern target</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Options Exit Signals</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>IV Contraction:</strong> Rapid decrease in implied volatility</li>
              <li><strong>OI Reduction:</strong> Significant decrease in relevant options open interest</li>
              <li><strong>Delta/Gamma Shift:</strong> Rapid changes in options greeks</li>
              <li><strong>Options Chain Structure:</strong> Shifts in options skew or term structure</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Confirmation Component</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>After identifying a potential setup, navigate to the Confirmation page</li>
          <li>Enter the ticker symbol and select the setup type (bullish, bearish, neutral)</li>
          <li>Review the entry confirmation signals to validate the setup</li>
          <li>Check the confirmation strength indicator</li>
          <li>Set alerts for exit confirmation signals</li>
          <li>Use the trade recommendation section for suggested entry, target, and stop levels</li>
        </ol>
        
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            Confirmation Strategy
          </h3>
          <p className="text-amber-800 dark:text-amber-300 mb-2">
            The Options-Technical Hybrid strategy requires a minimum of 3 confirmation signals for entry:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
            <li>At least 2 technical confirmation signals</li>
            <li>At least 1 options confirmation signal</li>
            <li>For exit, a minimum of 2 exit signals (either technical or options)</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    icon: <Calculator className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Risk Management Calculator</h2>
        <p className="mb-4">
          The Risk Management component helps determine appropriate position sizing and risk parameters for each trade. It integrates market volatility and account risk tolerance to ensure consistent risk management across different market conditions.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Position Sizing Principles</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Account Risk Percentage</h4>
            <p className="text-sm mb-2">
              The foundation of position sizing is determining what percentage of your account you're willing to risk on any single trade.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Conservative:</strong> 0.5% - 1% of account per trade</li>
              <li><strong>Moderate:</strong> 1% - 2% of account per trade</li>
              <li><strong>Aggressive:</strong> 2% - 3% of account per trade</li>
              <li><strong>Not Recommended:</strong> Over 3% of account per trade</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Volatility Adjustment</h4>
            <p className="text-sm mb-2">
              Adjusts position size based on current market volatility metrics to maintain consistent risk exposure.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>High IV Environment (IV Percentile &gt; 80%):</strong> Reduce position size by 20-30%</li>
              <li><strong>Moderate IV Environment (IV Percentile 40-80%):</strong> Standard position size</li>
              <li><strong>Low IV Environment (IV Percentile &lt; 40%):</strong> Increase position size by 10-20%</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Greek-Adjusted Position Sizing</h4>
            <p className="text-sm mb-2">
              Fine-tunes position size based on options greeks to account for non-linear risk.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Delta Exposure:</strong> Adjusts for directional risk</li>
              <li><strong>Gamma Exposure:</strong> Adjusts for acceleration risk</li>
              <li><strong>Vega Exposure:</strong> Adjusts for volatility risk</li>
              <li><strong>Theta Exposure:</strong> Adjusts for time decay risk</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Risk/Reward Principles</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Minimum Ratio Requirements</h4>
            <p className="text-sm mb-2">
              Recommended minimum risk/reward ratios for different setup types:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Directional Trades (Bullish/Bearish):</strong> Minimum 2:1 risk/reward ratio</li>
              <li><strong>Neutral/Range-Bound Trades:</strong> Minimum 1.5:1 risk/reward ratio</li>
              <li><strong>High-Probability Setups (&gt;80% strength):</strong> Minimum 1.5:1 risk/reward ratio</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Stop Loss Strategy</h4>
            <p className="text-sm mb-2">
              Guidelines for setting appropriate stop losses:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Technical Stop:</strong> Below/above key support/resistance levels</li>
              <li><strong>Volatility-Based Stop:</strong> Using ATR to set stop distance</li>
              <li><strong>Time-Based Stop:</strong> Exit if setup doesn't materialize within X days</li>
              <li><strong>Options-Based Stop:</strong> Based on delta or specific option price levels</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Risk Management Calculator</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Enter your account size</li>
          <li>Specify your risk percentage per trade</li>
          <li>Input the option premium or stock price</li>
          <li>Enter the current IV percentile (pulled from market data)</li>
          <li>Input the stop loss level for the trade</li>
          <li>The calculator will determine the appropriate position size</li>
          <li>Review the risk metrics and adjust as needed</li>
        </ol>
        
        <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Best Practices for Risk Management
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Never exceed your predetermined risk percentage per trade</li>
            <li>Adjust position size for higher volatility environments</li>
            <li>Consider total portfolio exposure to similar trades or correlated assets</li>
            <li>Use the calculator for every trade to maintain discipline</li>
            <li>Review historical trades to optimize your risk parameters over time</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'key-levels',
    title: 'Key Levels',
    icon: <LineChart className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Key Levels Visualization</h2>
        <p className="mb-4">
          The Key Levels component identifies important price levels using a combination of options data and technical analysis. These levels can serve as potential support, resistance, or price targets for trading decisions.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Options-Based Price Levels</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Open Interest Concentration</h4>
            <p className="text-sm mb-2">
              Strike prices with high open interest can act as price magnets or barriers.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Call Open Interest:</strong> Potential resistance or upside targets</li>
              <li><strong>Put Open Interest:</strong> Potential support or downside targets</li>
              <li><strong>Strength:</strong> Based on relative size of open interest compared to average</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Max Pain</h4>
            <p className="text-sm mb-2">
              The price point where options holders lose the most money at expiration.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Calculation:</strong> Strike price where the sum of all call and put option dollars is minimized</li>
              <li><strong>Significance:</strong> Price tends to gravitate toward max pain, especially near expiration</li>
              <li><strong>Time Sensitivity:</strong> More influential as expiration approaches</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Gamma Exposure (GEX)</h4>
            <p className="text-sm mb-2">
              Strike prices with high gamma can cause price acceleration or pinning.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Positive Gamma:</strong> Creates price stability and potential pinning</li>
              <li><strong>Negative Gamma:</strong> Creates price volatility and potential acceleration</li>
              <li><strong>Gamma Walls:</strong> Areas where significant gamma can act as support/resistance</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Technical Price Levels</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Moving Averages</h4>
            <p className="text-sm mb-2">
              Dynamic support and resistance levels based on historical price averages.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>EMA 10:</strong> Short-term support/resistance</li>
              <li><strong>EMA 20:</strong> Medium-term support/resistance</li>
              <li><strong>EMA 50:</strong> Long-term support/resistance</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Support & Resistance</h4>
            <p className="text-sm mb-2">
              Historical price levels that have acted as turning points.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Recent Highs/Lows:</strong> Short-term significant levels</li>
              <li><strong>Historical S/R:</strong> Areas of previous price congestion or reversals</li>
              <li><strong>Round Numbers:</strong> Psychological levels (e.g., $50, $100, $150)</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Fibonacci Levels</h4>
            <p className="text-sm mb-2">
              Key retracement and extension levels based on the Fibonacci sequence.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Retracements:</strong> 38.2%, 50%, 61.8% pullback levels</li>
              <li><strong>Extensions:</strong> 127.2%, 161.8% target levels</li>
              <li><strong>Usage:</strong> Identifying potential reversal zones and targets</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Key Levels Component</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Select a ticker from the dropdown menu</li>
          <li>Choose an options expiration date</li>
          <li>Toggle between Open Interest and Volume view</li>
          <li>Observe the options chain visualization with key levels highlighted</li>
          <li>Use the Max Pain and GEX Analysis sections for additional insights</li>
          <li>Identify clusters of support/resistance from both options and technical data</li>
          <li>Use these levels to inform entry, exit, and target points for trades</li>
        </ol>
        
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            Key Level Interpretation
          </h3>
          <p className="text-amber-800 dark:text-amber-300 mb-2">
            The strength of a key level increases when multiple sources confirm it:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
            <li><strong>Strong Level:</strong> Confirmed by both options data and technical analysis</li>
            <li><strong>Moderate Level:</strong> Strong signal from either options or technical analysis</li>
            <li><strong>Weak Level:</strong> Minor signal from a single source</li>
            <li>Always consider current market context when evaluating key levels</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'scanner',
    title: 'Scanner',
    icon: <Search className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Options-Technical Hybrid Scanner</h2>
        <p className="mb-4">
          The Scanner component helps you identify potential trade opportunities across multiple tickers by applying the Options-Technical Hybrid strategy criteria and advanced filtering options.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Scanner Functionality</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Hybrid Analysis Engine</h4>
            <p className="text-sm mb-2">
              The scanner evaluates both technical and options data to identify setups:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Bullish Setups:</strong> Identifies stocks with bullish technical patterns and options confirmation</li>
              <li><strong>Bearish Setups:</strong> Identifies stocks with bearish technical patterns and options confirmation</li>
              <li><strong>Neutral Setups:</strong> Identifies stocks with range-bound patterns and options confirmation</li>
              <li><strong>Setup Strength:</strong> Calculates a score based on how many criteria are met</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Advanced Filtering</h4>
            <p className="text-sm mb-2">
              Customize scan results with detailed filtering options:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Setup Type:</strong> Filter for specific setup types (bullish, bearish, neutral)</li>
              <li><strong>Technical Filters:</strong> Filter by RSI, stochastic RSI, EMA relationships</li>
              <li><strong>Options Filters:</strong> Filter by PCR, IV percentile, gamma exposure</li>
              <li><strong>Greek Filters:</strong> Include specific Greek metrics (gamma, vanna, charm)</li>
              <li><strong>Strength Filter:</strong> Filter by minimum setup strength</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Results Visualization</h4>
            <p className="text-sm mb-2">
              Multiple ways to view and analyze scan results:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Grid View:</strong> Card-based view with key metrics for each setup</li>
              <li><strong>Table View:</strong> Detailed tabular view with sortable columns</li>
              <li><strong>Market Summary:</strong> Overview of market sentiment and setup distribution</li>
              <li><strong>Watchlist Integration:</strong> Save interesting setups to your watchlist</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Scanner</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Select a ticker or choose "All Tickers" to scan the entire database</li>
          <li>Configure advanced filters according to your criteria</li>
          <li>Set the maximum number of tickers to analyze</li>
          <li>Click "Run Scanner" to start the analysis</li>
          <li>Review the Market Summary for an overview of results</li>
          <li>Toggle between Grid and Table views to analyze results</li>
          <li>Use the search function to find specific tickers</li>
          <li>Add promising setups to your watchlist for further analysis</li>
        </ol>
        
        <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Scanner Best Practices
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Start with broader filters and then narrow down results</li>
            <li>Focus on setups with high strength scores for better probabilities</li>
            <li>Use the scanner as a starting point, then perform detailed analysis</li>
            <li>Save frequently used filter combinations for future use</li>
            <li>For optimal performance, limit scans to 10-30 tickers at a time</li>
            <li>Check both Grid and Table views for different perspectives on the data</li>
          </ul>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Filter Recommendations</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Bullish Scan Filter</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Setup Type:</strong> Bullish</li>
              <li><strong>RSI:</strong> 50-70</li>
              <li><strong>Stochastic RSI:</strong> &gt;60</li>
              <li><strong>PCR:</strong> 0.5-1.0</li>
              <li><strong>Greek Analytics:</strong> Include Gamma</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Bearish Scan Filter</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Setup Type:</strong> Bearish</li>
              <li><strong>RSI:</strong> 30-50</li>
              <li><strong>Stochastic RSI:</strong> &lt;40</li>
              <li><strong>PCR:</strong> 1.0-1.5</li>
              <li><strong>Greek Analytics:</strong> Include Gamma</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Neutral/Range-Bound Scan Filter</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Setup Type:</strong> Neutral</li>
              <li><strong>RSI:</strong> 40-60</li>
              <li><strong>IV:</strong> 20-40</li>
              <li><strong>GEX:</strong> Neutral</li>
              <li><strong>Greek Analytics:</strong> Include Vanna</li>
            </ul>
          </div>
        </div>
      </>
    )
  },
  {
    id: 'backtesting',
    title: 'Backtesting',
    icon: <BarChart className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Strategy Backtesting Module</h2>
        <p className="mb-4">
          The Backtesting module allows you to test the Options-Technical Hybrid strategy against historical data to evaluate its performance and optimize parameters before using it in live trading.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Backtesting Capabilities</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Historical Strategy Testing</h4>
            <p className="text-sm mb-2">
              Test various strategies against historical market data:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Options-Technical Hybrid:</strong> The core strategy combining options and technical data</li>
              <li><strong>Momentum:</strong> A pure momentum-based approach</li>
              <li><strong>Mean Reversion:</strong> A strategy looking for price reversals</li>
              <li><strong>Volatility:</strong> A strategy based on volatility patterns</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Customizable Parameters</h4>
            <p className="text-sm mb-2">
              Fine-tune strategy parameters to find optimal settings:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Basic Parameters:</strong> Ticker, date range, setup type</li>
              <li><strong>Position Sizing:</strong> Initial capital, risk per trade, max positions</li>
              <li><strong>Technical Rules:</strong> RSI thresholds, EMA periods</li>
              <li><strong>Options Rules:</strong> Days to expiration, target delta, IV rank filters</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Performance Metrics</h4>
            <p className="text-sm mb-2">
              Comprehensive analysis of backtest results:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Return Metrics:</strong> Total return, annualized return, monthly returns</li>
              <li><strong>Risk Metrics:</strong> Sharpe ratio, max drawdown, volatility</li>
              <li><strong>Trade Statistics:</strong> Win rate, profit factor, average trade</li>
              <li><strong>Equity Curve:</strong> Visual representation of account growth</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Parameter Optimization</h4>
            <p className="text-sm mb-2">
              Automatically test multiple parameter values to find optimal settings:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Parameter Selection:</strong> Choose which parameter to optimize</li>
              <li><strong>Range Definition:</strong> Set the range and step size for optimization</li>
              <li><strong>Results Comparison:</strong> Compare performance across different parameter values</li>
              <li><strong>Optimization Insight:</strong> Recommendations based on optimization results</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Using the Backtesting Module</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Configure basic parameters (ticker, date range, strategy)</li>
          <li>Set position sizing parameters based on your risk tolerance</li>
          <li>Configure technical and options rules</li>
          <li>Enable parameter optimization if desired</li>
          <li>Click "Run Backtest" to execute the test</li>
          <li>Review the summary metrics to evaluate overall performance</li>
          <li>Analyze the performance charts for visual representation</li>
          <li>Examine individual trade history to understand strategy behavior</li>
          <li>Save promising backtest configurations for future reference</li>
        </ol>
        
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            Backtest Considerations
          </h3>
          <p className="text-amber-800 dark:text-amber-300 mb-2">
            When interpreting backtest results, keep these limitations in mind:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
            <li><strong>Past Performance:</strong> Historical results do not guarantee future performance</li>
            <li><strong>Overfitting:</strong> Avoid excessive optimization that may work only on historical data</li>
            <li><strong>Market Conditions:</strong> Different market regimes may yield different results</li>
            <li><strong>Execution Assumptions:</strong> Backtests assume perfect execution at modeled prices</li>
            <li><strong>Slippage & Commissions:</strong> Real-world trading includes costs that affect returns</li>
          </ul>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            Optimization Best Practices
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Optimize for risk-adjusted returns (Sharpe ratio) rather than total returns</li>
            <li>Evaluate performance across different market conditions</li>
            <li>Consider forward testing optimized parameters on recent data</li>
            <li>Save multiple parameter sets for different market environments</li>
            <li>Start with broader parameter ranges, then narrow down in subsequent tests</li>
          </ul>
        </div>
      </>
    )
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Settings and Configuration</h2>
        <p className="mb-4">
          The Settings page allows you to customize the dashboard according to your preferences and configure API keys and data collection parameters.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Available Settings</h3>
        <div className="space-y-3 mb-6">
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">General Settings</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Theme:</strong> Choose between light, dark, or system theme</li>
              <li><strong>Default View:</strong> Set default view mode (grid or table)</li>
              <li><strong>Compact Mode:</strong> Toggle for a more condensed UI layout</li>
              <li><strong>Metric Display:</strong> Choose which metrics to display in components</li>
              <li><strong>Default Ticker Limit:</strong> Set maximum number of tickers for scans</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">API Keys</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Yahoo Finance API Key:</strong> Optional key for extended access</li>
              <li><strong>Alpha Vantage API Key:</strong> Alternative data source</li>
              <li><strong>Security:</strong> Keys are stored in browser local storage</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Data Collection</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Auto Update:</strong> Enable/disable automatic data refreshing</li>
              <li><strong>Update Interval:</strong> Set frequency of data updates</li>
              <li><strong>Concurrent Requests:</strong> Maximum simultaneous API requests</li>
              <li><strong>Caching:</strong> Enable/disable data caching</li>
              <li><strong>Cache Duration:</strong> How long to keep cached data</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">Notifications</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Alert Notifications:</strong> Enable/disable browser notifications</li>
              <li><strong>Sound Alerts:</strong> Enable/disable sound for notifications</li>
              <li><strong>Alert Threshold:</strong> Minimum setup strength for alerts</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="text-md font-semibold mb-1">System Status</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Data Collection Status:</strong> Monitor active data collection jobs</li>
              <li><strong>Cache Status:</strong> View and manage cache entries</li>
              <li><strong>Performance Metrics:</strong> System uptime and stats</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">Managing Settings</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Navigate to the Settings page from the main dashboard</li>
          <li>Use the tabs to access different setting categories</li>
          <li>Modify settings according to your preferences</li>
          <li>Click "Save Settings" to apply changes</li>
          <li>Use "Reset to Defaults" to restore original settings</li>
          <li>Settings are stored in your browser's local storage</li>
        </ol>
        
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center mb-2 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            API Key Security
          </h3>
          <p className="text-amber-800 dark:text-amber-300">
            API keys are stored in your browser's local storage. Never share access to your dashboard or device with individuals you don't trust. The dashboard does not transmit your API keys to any third parties.
          </p>
        </div>
        
        <h3 className="text-xl font-bold mb-2">System Status Information</h3>
        <p className="mb-4">
          The System Status tab provides real-time information about the dashboard's operation:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li><strong>Data Collection Jobs:</strong> Currently monitored tickers</li>
          <li><strong>Collection Health:</strong> Status indicators for data collection tasks</li>
          <li><strong>Cache Statistics:</strong> Number and types of cached entries</li>
          <li><strong>System Information:</strong> Environment and uptime details</li>
        </ul>
        <p>
          You can use the "Clear Cache" button to force fresh data to be fetched on the next request, which is useful if you suspect any data inconsistencies.
        </p>
      </>
    )
  }
];

// FAQ items
const faqItems = [
  {
    question: "What is the Options-Technical Hybrid strategy?",
    answer: "The Options-Technical Hybrid strategy combines traditional technical analysis with options market data to identify high-probability trading opportunities. It looks for alignment between price action and options sentiment to confirm potential setups."
  },
  {
    question: "Do I need API keys to use this dashboard?",
    answer: "No, the dashboard functions with built-in data sources by default. API keys for Yahoo Finance or Alpha Vantage are optional and can provide enhanced data access and higher rate limits."
  },
  {
    question: "How are trade setups identified?",
    answer: "Trade setups are identified using a combination of technical indicators (EMAs, RSI, stochastic RSI) and options data (put-call ratio, IV percentile, gamma exposure). The system scores setups based on how many criteria are met, with different criteria for bullish, bearish, and neutral setups."
  },
  {
    question: "What confirmation signals should I look for?",
    answer: "The strategy requires a minimum of 3 confirmation signals: at least 2 technical signals (like Stochastic RSI hooks, volume spikes, price action) and at least 1 options signal (like OI changes, options flow, IV movement). These are outlined in detail in the Confirmation section."
  },
  {
    question: "How should I determine position size?",
    answer: "The Risk Management Calculator helps determine position size based on your account size, risk tolerance, and market volatility. The general recommendation is to risk no more than 1-2% of your account on any single trade, with adjustments for volatility."
  },
  {
    question: "What ticker symbols are supported?",
    answer: "The dashboard supports major US stocks and ETFs, focusing on liquid options chains. The default database includes the NASDAQ 100 components and major ETFs like SPY, QQQ, and IWM."
  },
  {
    question: "How often is the data updated?",
    answer: "By default, quote data is updated every 10-20 seconds, options data every 15 minutes, and historical data every 24 hours. These intervals can be customized in the Settings page."
  },
  {
    question: "Can I backtest the strategy before using it?",
    answer: "Yes, the Backtesting module allows you to test the strategy against historical data with customizable parameters. You can also optimize parameters to find the best settings for your trading style."
  },
  {
    question: "Where is my data stored?",
    answer: "User settings, saved backtests, and watchlist items are stored in your browser's local storage. API keys are also stored locally and are not transmitted to any third parties."
  },
  {
    question: "Is this dashboard suitable for day trading or longer-term trading?",
    answer: "The dashboard is flexible and can be used for various timeframes. For day trading, focus on shorter-term signals and more frequent data updates. For swing trading, focus on stronger setups with higher confirmation requirements."
  }
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState(documentationSections[0].id);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">User Guide & Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to use the Options-Technical Hybrid Dashboard to improve your trading
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>Browse by topic</CardDescription>
          </CardHeader>
          <div className="border-t"></div>
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="py-2">
              {documentationSections.map((section) => (
                <button
                  key={section.id}
                  className={`flex items-center w-full px-4 py-2 text-sm text-left transition-colors ${
                    activeSection === section.id 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>
        
        {/* Content Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <Tabs defaultValue="documentation" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="documentation" className="flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  Documentation
                </TabsTrigger>
                <TabsTrigger value="faq" className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </TabsTrigger>
                <TabsTrigger value="quick-start" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Quick Start Guide
                </TabsTrigger>
              </TabsList>
              
              {/* Documentation Tab */}
              <TabsContent value="documentation">
                <ScrollArea className="h-[calc(100vh-15rem)]">
                  <div className="p-4">
                    {documentationSections.map((section) => (
                      <div 
                        key={section.id} 
                        id={section.id}
                        className={activeSection === section.id ? '' : 'hidden'}
                      >
                        {section.content}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* FAQ Tab */}
              <TabsContent value="faq">
                <ScrollArea className="h-[calc(100vh-15rem)]">
                  <div className="p-4">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                      {faqItems.map((faq, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <button
                            className="flex justify-between items-center w-full p-4 text-left font-medium"
                            onClick={() => toggleFaq(index)}
                          >
                            <span>{faq.question}</span>
                            {expandedFaqs[index] ? (
                              <ChevronDown className="h-5 w-5 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-5 w-5 flex-shrink-0" />
                            )}
                          </button>
                          {expandedFaqs[index] && (
                            <div className="p-4 pt-0 border-t">
                              <p className="text-muted-foreground">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Quick Start Guide Tab */}
              <TabsContent value="quick-start">
                <ScrollArea className="h-[calc(100vh-15rem)]">
                  <div className="p-4">
                    <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
                    <p className="mb-6">
                      This guide will help you get started with the Options-Technical Hybrid Dashboard in just a few steps.
                    </p>
                    
                    <div className="space-y-8">
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          Step 1: Understand Market Context
                        </h3>
                        <p className="mb-3">
                          Start by checking the overall market conditions using the Market Context Dashboard.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mb-3">
                          <li>Navigate to the Market Context page</li>
                          <li>Select a major index (e.g., SPY) to understand broad market trends</li>
                          <li>Note the current trend, momentum, and options sentiment</li>
                        </ol>
                        <Button asChild className="mt-2">
                          <Link href="/market-context">
                            Open Market Context
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                          <Search className="h-5 w-5 mr-2" />
                          Step 2: Find Potential Setups
                        </h3>
                        <p className="mb-3">
                          Use the Scanner to identify potential trade opportunities aligned with the current market.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mb-3">
                          <li>Navigate to the Scanner page</li>
                          <li>Select "All Tickers" to scan the entire database</li>
                          <li>Choose a setup type based on your market analysis</li>
                          <li>Click "Run Scanner" to find potential opportunities</li>
                          <li>Focus on setups with strength &gt;70%</li>
                        </ol>
                        <Button asChild className="mt-2">
                          <Link href="/scanner">
                            Open Scanner
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Step 3: Confirm the Setup
                        </h3>
                        <p className="mb-3">
                          Validate potential setups with the Confirmation component.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mb-3">
                          <li>Navigate to the Confirmation page</li>
                          <li>Enter the ticker symbol from your scanner results</li>
                          <li>Check for at least 3 confirmation signals (2 technical, 1 options)</li>
                          <li>Ensure the setup aligns with your market bias</li>
                        </ol>
                        <Button asChild className="mt-2">
                          <Link href="/confirmation">
                            Open Confirmation
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                          <LineChart className="h-5 w-5 mr-2" />
                          Step 4: Identify Key Levels
                        </h3>
                        <p className="mb-3">
                          Use the Key Levels component to identify potential support, resistance, and target levels.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mb-3">
                          <li>Navigate to the Key Levels page</li>
                          <li>Enter the ticker symbol and select an expiration date</li>
                          <li>Identify key levels from options open interest</li>
                          <li>Note max pain and areas of high gamma exposure</li>
                          <li>Use these levels to determine entry, stop loss, and target prices</li>
                        </ol>
                        <Button asChild className="mt-2">
                          <Link href="/key-levels">
                            Open Key Levels
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                          <Calculator className="h-5 w-5 mr-2" />
                          Step 5: Calculate Position Size
                        </h3>
                        <p className="mb-3">
                          Use the Risk Management calculator to determine appropriate position size.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mb-3">
                          <li>Navigate to the Risk Management page</li>
                          <li>Enter your account size and risk percentage</li>
                          <li>Input the option premium or stock price</li>
                          <li>Enter your stop loss level from the Key Levels analysis</li>
                          <li>Get the recommended position size</li>
                        </ol>
                        <Button asChild className="mt-2">
                          <Link href="/risk-management">
                            Open Risk Management
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-8 bg-primary/10 border border-primary/20 rounded-md p-4">
                      <h3 className="text-lg font-semibold flex items-center mb-2">
                        <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                        Next Steps
                      </h3>
                      <p className="mb-3">
                        Once you're comfortable with the basic workflow, explore these advanced features:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Use the Backtesting module to validate and optimize strategy parameters</li>
                        <li>Customize the dashboard settings to match your preferences</li>
                        <li>Explore advanced filtering options in the Scanner</li>
                        <li>Review the documentation for in-depth understanding of each component</li>
                      </ul>
                      <div className="mt-4 flex space-x-3">
                        <Button asChild variant="outline">
                          <Link href="/backtesting">
                            <BarChart className="mr-2 h-4 w-4" />
                            Backtesting
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/">
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href="/scanner">
            Start Using Scanner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}