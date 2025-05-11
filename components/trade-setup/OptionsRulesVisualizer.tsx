"use client";

import { useTheme } from "next-themes";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { cn } from "@/lib/utils";
import { RuleCheckItem } from "../RuleCheckItem";
import { Badge } from "../ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  ArrowUpDown,
  Check
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Strike {
  strike: number;
  calls: {
    openInterest: number;
    volume: number;
    iv: number;
  };
  puts: {
    openInterest: number;
    volume: number;
    iv: number;
  };
}

interface OptionsRulesVisualizerProps {
  data: {
    strikes: Strike[];
    currentPrice: number;
    pcr: number;
    ivPercentile: number;
    ivSkew: number;
    maxPain: number;
    gex: number;
  };
  setupType: 'bullish' | 'bearish' | 'neutral';
  rules: {
    pcrThreshold: boolean;
    openInterestPattern: boolean;
    ivCondition: boolean;
    gexAlignment: boolean;
  };
  className?: string;
}

export default function OptionsRulesVisualizer({
  data,
  setupType,
  rules,
  className,
}: OptionsRulesVisualizerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  // Prepare data for the open interest chart
  const labels = data.strikes.map(strike => strike.strike.toString());
  const callOI = data.strikes.map(strike => strike.calls.openInterest);
  const putOI = data.strikes.map(strike => -strike.puts.openInterest); // Negative to show below x-axis
  
  // Find current price index
  const currentPriceIndex = data.strikes.findIndex(
    strike => strike.strike >= data.currentPrice
  );
  
  // Find max pain index
  const maxPainIndex = data.strikes.findIndex(
    strike => strike.strike >= data.maxPain
  );

  // Generate options chain chart data
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Call OI',
        data: callOI,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(5, 150, 105, 0.7)',
        borderColor: isDark ? 'rgba(16, 185, 129, 1)' : 'rgba(5, 150, 105, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Put OI',
        data: putOI,
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.7)' : 'rgba(220, 38, 38, 0.7)',
        borderColor: isDark ? 'rgba(239, 68, 68, 1)' : 'rgba(220, 38, 38, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  
  // Create a plugin for adding annotations
  const annotationPlugin = {
    id: 'optionsAnnotations',
    afterDraw: (chart: any) => {
      const {ctx, chartArea, scales} = chart;
      const {top, bottom, left, right} = chartArea;
      const {x, y} = scales;
      
      // Current price line
      if (currentPriceIndex >= 0) {
        const xPos = x.getPixelForValue(currentPriceIndex);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        
        // Price label
        ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)';
        const text = `$${data.currentPrice}`;
        const textWidth = ctx.measureText(text).width + 10;
        ctx.fillRect(xPos - textWidth/2, top - 20, textWidth, 20);
        ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, xPos, top - 10);
        ctx.restore();
      }
      
      // Max pain line
      if (maxPainIndex >= 0) {
        const xPos = x.getPixelForValue(maxPainIndex);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? 'rgba(124, 58, 237, 0.8)' : 'rgba(109, 40, 217, 0.8)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        
        // Max pain label
        ctx.fillStyle = isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(109, 40, 217, 0.2)';
        const text = 'Max Pain';
        const textWidth = ctx.measureText(text).width + 10;
        ctx.fillRect(xPos - textWidth/2, top - 40, textWidth, 20);
        ctx.fillStyle = isDark ? 'rgba(124, 58, 237, 1)' : 'rgba(109, 40, 217, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, xPos, top - 30);
        ctx.restore();
      }
      
      // Zero line for OI chart
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left, y.getPixelForValue(0));
      ctx.lineTo(right, y.getPixelForValue(0));
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(161, 161, 170, 0.3)' : 'rgba(113, 113, 122, 0.3)';
      ctx.stroke();
      ctx.restore();
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? "#e4e4e7" : "#27272a",
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDark ? "#e4e4e7" : "#27272a",
        bodyColor: isDark ? "#e4e4e7" : "#27272a",
        borderColor: isDark ? "rgba(63, 63, 70, 1)" : "rgba(228, 228, 231, 1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (tooltipItems: any) => {
            return `Strike: $${tooltipItems[0].label}`;
          },
          label: (tooltipItem: any) => {
            if (tooltipItem.dataset.label === 'Put OI') {
              return `Put OI: ${Math.abs(tooltipItem.parsed.y).toLocaleString()}`;
            }
            return `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Strike Price',
          color: isDark ? "#a1a1aa" : "#71717a",
        },
        ticks: {
          color: isDark ? "#a1a1aa" : "#71717a",
          callback: function(value: any, index: number) {
            // Show fewer ticks for readability
            return index % 2 === 0 ? '$' + data.strikes[index].strike : '';
          }
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Open Interest',
          color: isDark ? "#a1a1aa" : "#71717a",
        },
        ticks: {
          color: isDark ? "#a1a1aa" : "#71717a",
          callback: function(value: any) {
            return value >= 0 
              ? value >= 1000 
                ? (value / 1000) + 'K' 
                : value
              : value <= -1000 
                ? (value / -1000) + 'K' 
                : value;
          }
        },
        grid: {
          color: isDark ? "rgba(63, 63, 70, 0.2)" : "rgba(228, 228, 231, 0.5)",
        },
      },
    },
  };

  // Get setup icon and color based on type
  const getSetupIcon = () => {
    switch (setupType) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'neutral':
        return <Minus className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSetupColor = () => {
    switch (setupType) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  // Calculate matching percentage
  const rulesArray = Object.values(rules);
  const passedRules = rulesArray.filter(rule => rule).length;
  const matchPercentage = Math.round((passedRules / rulesArray.length) * 100);

  // Format GEX for display
  const formatGEX = (gex: number) => {
    if (Math.abs(gex) >= 1000000) {
      return `${(gex / 1000000).toFixed(2)}M`;
    } else if (Math.abs(gex) >= 1000) {
      return `${(gex / 1000).toFixed(1)}K`;
    }
    return gex.toFixed(0);
  };

  // Calculate PCR status and messages
  const getPCRStatus = () => {
    if (setupType === 'bullish') {
      return {
        message: "PCR below threshold (< 0.8)",
        value: data.pcr.toFixed(2),
        passed: data.pcr < 0.8,
      };
    } else if (setupType === 'bearish') {
      return {
        message: "PCR above threshold (> 1.2)",
        value: data.pcr.toFixed(2),
        passed: data.pcr > 1.2,
      };
    } else {
      return {
        message: "PCR balanced (0.8-1.2)",
        value: data.pcr.toFixed(2),
        passed: data.pcr >= 0.8 && data.pcr <= 1.2,
      };
    }
  };

  // Calculate OI Pattern status
  const getOIPatternStatus = () => {
    if (setupType === 'bullish') {
      return {
        message: "High call OI at higher strikes",
        value: "Call wall above",
        passed: rules.openInterestPattern,
      };
    } else if (setupType === 'bearish') {
      return {
        message: "High put OI at lower strikes",
        value: "Put wall below",
        passed: rules.openInterestPattern,
      };
    } else {
      return {
        message: "Balanced OI distribution around price",
        value: "Balanced OI",
        passed: rules.openInterestPattern,
      };
    }
  };

  // Calculate IV condition status
  const getIVStatus = () => {
    if (setupType === 'bullish') {
      return {
        message: "IV in favorable percentile (<50th)",
        value: `${data.ivPercentile}% IV Percentile`,
        passed: data.ivPercentile < 50,
      };
    } else if (setupType === 'bearish') {
      return {
        message: "IV in favorable percentile (>60th)",
        value: `${data.ivPercentile}% IV Percentile`,
        passed: data.ivPercentile > 60,
      };
    } else {
      return {
        message: "IV in favorable range for premium selling",
        value: `${data.ivPercentile}% IV Percentile`,
        passed: data.ivPercentile > 65,
      };
    }
  };

  // Calculate GEX condition status
  const getGEXStatus = () => {
    if (setupType === 'bullish') {
      return {
        message: "Positive GEX (>$500K)",
        value: `GEX: ${formatGEX(data.gex)}`,
        passed: data.gex > 500000,
      };
    } else if (setupType === 'bearish') {
      return {
        message: "Negative GEX (<-$500K)",
        value: `GEX: ${formatGEX(data.gex)}`,
        passed: data.gex < -500000,
      };
    } else {
      return {
        message: "Low absolute GEX (< ±$200K)",
        value: `GEX: ${formatGEX(data.gex)}`,
        passed: Math.abs(data.gex) < 200000,
      };
    }
  };

  const pcrStatus = getPCRStatus();
  const oiStatus = getOIPatternStatus();
  const ivStatus = getIVStatus();
  const gexStatus = getGEXStatus();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSetupIcon()}
          <h3 className={cn("text-lg font-medium", getSetupColor())}>
            {setupType.charAt(0).toUpperCase() + setupType.slice(1)} Options Conditions
          </h3>
        </div>
        <Badge 
          variant={matchPercentage >= 75 ? "default" : "outline"} 
          className={
            matchPercentage >= 75 
              ? setupType === 'bullish' 
                ? 'bg-green-600 dark:bg-green-900'
                : setupType === 'bearish'
                ? 'bg-red-600 dark:bg-red-900'
                : 'bg-blue-600 dark:bg-blue-900'
              : ''
          }
        >
          {matchPercentage}% Match
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Options chain/OI visualization */}
          <div className="h-[250px] relative rounded-md overflow-hidden border dark:border-zinc-800">
            <Bar 
              data={chartData} 
              options={chartOptions} 
              plugins={[annotationPlugin]}
            />
          </div>
          
          {/* Key options metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex justify-between items-center">
              <span className="font-medium">Current Price:</span>
              <span className="font-mono">${data.currentPrice.toFixed(2)}</span>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex justify-between items-center">
              <span className="font-medium">Max Pain:</span>
              <span className="font-mono">${data.maxPain.toFixed(2)}</span>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex justify-between items-center">
              <span className="font-medium">Put/Call Ratio:</span>
              <span className={cn(
                "font-mono",
                data.pcr < 0.8 ? 'text-green-600 dark:text-green-400' :
                data.pcr > 1.2 ? 'text-red-600 dark:text-red-400' : ''
              )}>{data.pcr.toFixed(2)}</span>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex justify-between items-center">
              <span className="font-medium">IV Skew:</span>
              <span className={cn(
                "font-mono",
                data.ivSkew > 0 ? 'text-green-600 dark:text-green-400' :
                data.ivSkew < 0 ? 'text-red-600 dark:text-red-400' : ''
              )}>{data.ivSkew.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Rules checks */}
          <RuleCheckItem
            title="Put-Call Ratio"
            description={pcrStatus.message}
            passed={pcrStatus.passed}
            value={pcrStatus.value}
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="Open Interest Pattern"
            description={oiStatus.message}
            passed={oiStatus.passed}
            value={oiStatus.value}
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="IV Condition"
            description={ivStatus.message}
            passed={ivStatus.passed}
            value={ivStatus.value}
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="GEX Alignment"
            description={gexStatus.message}
            passed={gexStatus.passed}
            value={gexStatus.value}
            setupType={setupType}
          />
          
          {/* Trade recommendation */}
          <div className={cn(
            "rounded-md border p-4 mt-4",
            setupType === 'bullish'
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : setupType === 'bearish'
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-sm font-medium",
                getSetupColor()
              )}>
                Options Strategy:
              </span>
            </div>
            <p className="text-sm">
              {setupType === 'bullish'
                ? "Consider call options or call spreads with strikes just above current price. Target expiration after expected move with 30-45 days preferred."
                : setupType === 'bearish'
                ? "Consider put options or put spreads with strikes just below current price. Target expiration after expected move with 30-45 days preferred."
                : "Consider iron condors or strangles based on expected range. Sell premium with strikes outside expected trading range with 14-30 days to expiration."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}