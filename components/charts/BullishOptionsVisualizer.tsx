"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Target, 
  ArrowUp, 
  Zap,
  DollarSign,
  Award,
  Calendar,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define the Strike interface
interface Strike {
  strike: number;
  call: {
    oi: number;
    volume: number;
    iv: number;
    gamma: number;
    charm: number;
    vanna: number;
    vomma: number;
  };
  put: {
    oi: number;
    volume: number;
    iv: number;
    gamma: number;
    charm: number;
    vanna: number;
    vomma: number;
  };
}

interface KeyLevels {
  support: number[];
  resistance: number[];
  maxPain: number;
}

interface BullishOptionsVisualizerProps {
  strikes: Strike[];
  currentPrice: number;
  keyLevels: KeyLevels;
  height?: number;
  className?: string;
}

export default function BullishOptionsVisualizer({
  strikes,
  currentPrice,
  keyLevels,
  height = 350,
  className,
}: BullishOptionsVisualizerProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'call' | 'callspread' | 'butterflies'>('call');
  
  // Find the closest strikes to use in strategies
  const nearestStrikeIndex = strikes.findIndex(strike => strike.strike >= currentPrice);
  const atm = strikes[nearestStrikeIndex];
  const itm = strikes[Math.max(0, nearestStrikeIndex - 1)];
  const otm = strikes[Math.min(strikes.length - 1, nearestStrikeIndex + 1)];
  const farOtm = strikes[Math.min(strikes.length - 1, nearestStrikeIndex + 2)];
  
  // Find support and resistance levels nearby
  const nearestSupportValue = keyLevels.support.reduce((prev, curr) => {
    return (Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev);
  }, 0);
  
  const nearestResistanceValue = keyLevels.resistance.reduce((prev, curr) => {
    return (Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev);
  }, Infinity);
  
  // Calculate risk metrics
  const riskRewardRatio = (selectedStrategy === 'call') 
    ? (nearestResistanceValue - currentPrice) / (currentPrice - atm.call.iv * currentPrice / 100) 
    : (selectedStrategy === 'callspread')
      ? (otm.strike - atm.strike) / (atm.call.iv - otm.call.iv) / 10
      : 3.5; // Approximate for butterflies
  
  const winProbability = (selectedStrategy === 'call')
    ? (currentPrice > keyLevels.maxPain ? 65 : 55)
    : (selectedStrategy === 'callspread')
      ? (currentPrice > keyLevels.maxPain ? 60 : 50)
      : 40; // Lower for butterflies
  
  // Get the appropriate strikes based on selected strategy
  const getStrategyStrikes = () => {
    switch (selectedStrategy) {
      case 'call':
        return [atm];
      case 'callspread':
        return [atm, otm];
      case 'butterflies':
        return [itm, atm, farOtm];
      default:
        return [atm];
    }
  };
  
  // Get strategy description
  const getStrategyDescription = () => {
    switch (selectedStrategy) {
      case 'call':
        return `Buy ${atm.strike} Call`;
      case 'callspread':
        return `Buy ${atm.strike} Call / Sell ${otm.strike} Call`;
      case 'butterflies':
        return `Buy ${itm.strike} Call / Sell 2× ${atm.strike} Call / Buy ${farOtm.strike} Call`;
      default:
        return '';
    }
  };
  
  // Chart data generation
  const generateChartData = () => {
    const strategyStrikes = getStrategyStrikes();
    const labels = strategyStrikes.map(strike => `$${strike.strike}`);
    
    // Different data based on strategy type
    let expectedValues = [];
    let costBasis = [];
    let maxProfit = [];
    
    if (selectedStrategy === 'call') {
      const callPrice = atm.call.iv * currentPrice / 100 / 4; // Simplified pricing
      costBasis = [callPrice];
      expectedValues = [Math.max(0, (nearestResistanceValue - atm.strike) - callPrice)];
      maxProfit = [Infinity]; // Unlimited upside
    } else if (selectedStrategy === 'callspread') {
      const atmCallPrice = atm.call.iv * currentPrice / 100 / 4;
      const otmCallPrice = otm.call.iv * currentPrice / 100 / 4;
      costBasis = [atmCallPrice, -otmCallPrice];
      const netCost = atmCallPrice - otmCallPrice;
      expectedValues = [Math.max(0, (otm.strike - atm.strike) - netCost), netCost];
      maxProfit = [(otm.strike - atm.strike) - netCost, netCost];
    } else {
      // Butterfly pricing (simplified)
      const itmPrice = itm.call.iv * currentPrice / 100 / 4;
      const atmPrice = atm.call.iv * currentPrice / 100 / 4;
      const farOtmPrice = farOtm.call.iv * currentPrice / 100 / 5;
      costBasis = [itmPrice, -2 * atmPrice, farOtmPrice];
      const netCost = itmPrice - 2 * atmPrice + farOtmPrice;
      expectedValues = [
        netCost, 
        Math.max(0, (farOtm.strike - atm.strike) - netCost), 
        netCost
      ];
      maxProfit = [netCost, (atm.strike - itm.strike) - netCost, netCost];
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Cost Basis',
          data: costBasis,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: 'Expected Value',
          data: expectedValues,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: 'Max Profit',
          data: maxProfit,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          color: '#a1a1aa',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e4e4e7',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            return `Strike: ${items[0].label}`;
          },
          label: (context) => {
            const dataset = context.dataset.label || '';
            let value = context.parsed.y;
            
            if (dataset === 'Max Profit' && value === Infinity) {
              return `${dataset}: Unlimited Upside`;
            }
            
            return `${dataset}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Strike Prices',
          color: '#a1a1aa',
        },
        ticks: {
          color: '#a1a1aa',
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value ($)',
          color: '#a1a1aa',
        },
        ticks: {
          color: '#a1a1aa',
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.15)',
        },
      },
    },
  };
  
  // Calculate key metrics
  const getROI = () => {
    if (selectedStrategy === 'call') {
      const callPrice = atm.call.iv * currentPrice / 100 / 4;
      return ((nearestResistanceValue - atm.strike) / callPrice * 100).toFixed(0);
    } else if (selectedStrategy === 'callspread') {
      const atmCallPrice = atm.call.iv * currentPrice / 100 / 4;
      const otmCallPrice = otm.call.iv * currentPrice / 100 / 4;
      const netCost = atmCallPrice - otmCallPrice;
      return (((otm.strike - atm.strike) - netCost) / netCost * 100).toFixed(0);
    } else {
      // Butterfly
      const itmPrice = itm.call.iv * currentPrice / 100 / 4;
      const atmPrice = atm.call.iv * currentPrice / 100 / 4;
      const farOtmPrice = farOtm.call.iv * currentPrice / 100 / 5;
      const netCost = itmPrice - 2 * atmPrice + farOtmPrice;
      return (((atm.strike - itm.strike) - netCost) / netCost * 100).toFixed(0);
    }
  };
  
  const getMaxLoss = () => {
    if (selectedStrategy === 'call') {
      return (atm.call.iv * currentPrice / 100 / 4).toFixed(2);
    } else if (selectedStrategy === 'callspread') {
      const atmCallPrice = atm.call.iv * currentPrice / 100 / 4;
      const otmCallPrice = otm.call.iv * currentPrice / 100 / 4;
      return (atmCallPrice - otmCallPrice).toFixed(2);
    } else {
      const itmPrice = itm.call.iv * currentPrice / 100 / 4;
      const atmPrice = atm.call.iv * currentPrice / 100 / 4;
      const farOtmPrice = farOtm.call.iv * currentPrice / 100 / 5;
      return (itmPrice - 2 * atmPrice + farOtmPrice).toFixed(2);
    }
  };
  
  // Generate pricing table data
  const getPricingData = () => {
    if (selectedStrategy === 'call') {
      return [
        {
          label: `${atm.strike} Call`,
          action: 'Buy',
          price: (atm.call.iv * currentPrice / 100 / 4).toFixed(2),
          iv: atm.call.iv.toFixed(1) + '%',
        }
      ];
    } else if (selectedStrategy === 'callspread') {
      return [
        {
          label: `${atm.strike} Call`,
          action: 'Buy',
          price: (atm.call.iv * currentPrice / 100 / 4).toFixed(2),
          iv: atm.call.iv.toFixed(1) + '%',
        },
        {
          label: `${otm.strike} Call`,
          action: 'Sell',
          price: (otm.call.iv * currentPrice / 100 / 4).toFixed(2),
          iv: otm.call.iv.toFixed(1) + '%',
        }
      ];
    } else {
      return [
        {
          label: `${itm.strike} Call`,
          action: 'Buy',
          price: (itm.call.iv * currentPrice / 100 / 4).toFixed(2),
          iv: itm.call.iv.toFixed(1) + '%',
        },
        {
          label: `${atm.strike} Call`,
          action: 'Sell (2×)',
          price: (atm.call.iv * currentPrice / 100 / 4).toFixed(2),
          iv: atm.call.iv.toFixed(1) + '%',
        },
        {
          label: `${farOtm.strike} Call`,
          action: 'Buy',
          price: (farOtm.call.iv * currentPrice / 100 / 5).toFixed(2),
          iv: farOtm.call.iv.toFixed(1) + '%',
        }
      ];
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Bullish Options Strategies
        </h3>
        
        <div className="flex space-x-2 ml-auto">
          <Button
            onClick={() => setSelectedStrategy('call')}
            variant={selectedStrategy === 'call' ? 'default' : 'outline'}
            size="sm"
          >
            <Target className="w-4 h-4 mr-1" />
            Long Call
          </Button>
          <Button
            onClick={() => setSelectedStrategy('callspread')}
            variant={selectedStrategy === 'callspread' ? 'default' : 'outline'}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Call Spread
          </Button>
          <Button
            onClick={() => setSelectedStrategy('butterflies')}
            variant={selectedStrategy === 'butterflies' ? 'default' : 'outline'}
            size="sm"
          >
            <Award className="w-4 h-4 mr-1" />
            Butterfly
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strategy Visualization */}
        <div className="col-span-2 bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium">{selectedStrategy === 'call' ? 'Long Call Strategy' : selectedStrategy === 'callspread' ? 'Call Debit Spread' : 'Long Call Butterfly'}</h4>
              <p className="text-sm text-muted-foreground">{getStrategyDescription()}</p>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn(
                "text-sm",
                riskRewardRatio > 3 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                riskRewardRatio > 1.5 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
              )}
            >
              Risk/Reward: {riskRewardRatio.toFixed(1)}
            </Badge>
          </div>
          
          <div style={{ height }}>
            <Bar 
              data={generateChartData()} 
              options={options}
            />
          </div>
        </div>
        
        {/* Strategy Details */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Key Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                Strategy Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Max Return:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {selectedStrategy === 'call' ? 'Unlimited' : selectedStrategy === 'callspread' ? `$${(otm.strike - atm.strike).toFixed(2)}` : `$${(atm.strike - itm.strike).toFixed(2)}`}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Max Loss:</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                  ${getMaxLoss()}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Potential ROI:</span>
                <Badge>
                  {getROI()}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Probability:</span>
                <Badge variant="outline" className={cn(
                  winProbability > 60 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                  winProbability > 45 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                )}>
                  {winProbability}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Break-even:</span>
                <Badge variant="secondary">
                  ${selectedStrategy === 'call' 
                    ? (atm.strike + parseFloat(getMaxLoss())).toFixed(2)
                    : selectedStrategy === 'callspread'
                      ? (atm.strike + parseFloat(getMaxLoss())).toFixed(2)
                      : (itm.strike + parseFloat(getMaxLoss())).toFixed(2)
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Pricing Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                Strategy Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 text-left">Option</th>
                    <th className="py-2 text-left">Action</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {getPricingData().map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2">{item.label}</td>
                      <td className={item.action.includes('Buy') ? "text-green-600 py-2" : "text-red-600 py-2"}>
                        {item.action}
                      </td>
                      <td className="py-2 text-right">${item.price}</td>
                      <td className="py-2 text-right">{item.iv}</td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td className="py-2">Net Cost</td>
                    <td colSpan={2} className="py-2 text-right">${getMaxLoss()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
          
          {/* Risk/Protection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Shield className="w-4 h-4 mr-1 text-purple-500" />
                Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {selectedStrategy === 'call' 
                  ? 'Stop loss at 50% of premium. Consider taking profit at resistance or if target is reached.'
                  : selectedStrategy === 'callspread'
                    ? 'Limited risk strategy. Consider adjusting if price moves below support.'
                    : 'Complex, direction-neutral strategy. Profit target at 50% of max theoretical profit.'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suggested position size: 
                <span className="font-medium"> {
                  selectedStrategy === 'call' ? '2-3%' :
                  selectedStrategy === 'callspread' ? '3-5%' : '1-2%'
                } of portfolio</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}