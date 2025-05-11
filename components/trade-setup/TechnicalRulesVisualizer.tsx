"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { RuleCheckItem } from "../RuleCheckItem";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TechnicalRulesVisualizerProps {
  data: {
    dates: string[];
    prices: number[];
    ema10: number[];
    ema20: number[];
    ema50: number[];
    rsi: number[];
    volume: number[];
  };
  setupType: 'bullish' | 'bearish' | 'neutral';
  rules: {
    emaAlignment: boolean;
    rsiCondition: boolean;
    volumeTrend: boolean;
    priceBreakout: boolean;
  };
  className?: string;
}

export default function TechnicalRulesVisualizer({
  data,
  setupType,
  rules,
  className,
}: TechnicalRulesVisualizerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  // Generate line chart data with technical indicators
  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: "Price",
        data: data.prices,
        borderColor: isDark ? "rgba(99, 102, 241, 1)" : "rgba(79, 70, 229, 1)",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(79, 70, 229, 0.3)");
          gradient.addColorStop(1, isDark ? "rgba(99, 102, 241, 0)" : "rgba(79, 70, 229, 0)");
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
      },
      {
        label: "10 EMA",
        data: data.ema10,
        borderColor: isDark ? "rgba(16, 185, 129, 1)" : "rgba(5, 150, 105, 1)",
        borderWidth: 2,
        borderDash: [],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "20 EMA",
        data: data.ema20,
        borderColor: isDark ? "rgba(245, 158, 11, 1)" : "rgba(217, 119, 6, 1)",
        borderWidth: 2,
        borderDash: [],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "50 EMA",
        data: data.ema50,
        borderColor: isDark ? "rgba(239, 68, 68, 1)" : "rgba(220, 38, 38, 1)",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: isDark ? "#e4e4e7" : "#27272a",
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDark ? "#e4e4e7" : "#27272a",
        bodyColor: isDark ? "#e4e4e7" : "#27272a",
        borderColor: isDark ? "rgba(63, 63, 70, 1)" : "rgba(228, 228, 231, 1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDark ? "rgba(63, 63, 70, 0.5)" : "rgba(228, 228, 231, 0.5)",
        },
        ticks: {
          color: isDark ? "#a1a1aa" : "#71717a",
          maxRotation: 45,
          minRotation: 45,
          // Only show a subset of dates for readability
          callback: function(value: any, index: number) {
            return index % 3 === 0 ? data.dates[index] : '';
          }
        },
      },
      y: {
        grid: {
          color: isDark ? "rgba(63, 63, 70, 0.2)" : "rgba(228, 228, 231, 0.5)",
        },
        ticks: {
          color: isDark ? "#a1a1aa" : "#71717a",
          callback: function(value: any) {
            return '$' + value;
          }
        },
      },
    },
  };

  // RSI chart data
  const rsiChartData = {
    labels: data.dates,
    datasets: [
      {
        label: "RSI",
        data: data.rsi,
        borderColor: isDark ? "rgba(139, 92, 246, 1)" : "rgba(124, 58, 237, 1)",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 80);
          gradient.addColorStop(0, isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.2)");
          gradient.addColorStop(1, isDark ? "rgba(139, 92, 246, 0)" : "rgba(124, 58, 237, 0)");
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // RSI chart options
  const rsiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDark ? "#e4e4e7" : "#27272a",
        bodyColor: isDark ? "#e4e4e7" : "#27272a",
        borderColor: isDark ? "rgba(63, 63, 70, 1)" : "rgba(228, 228, 231, 1)",
        borderWidth: 1,
        padding: 8,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: isDark ? "rgba(63, 63, 70, 0.2)" : "rgba(228, 228, 231, 0.5)",
        },
        ticks: {
          color: isDark ? "#a1a1aa" : "#71717a",
        },
      },
    },
    // Add red/green region annotations
    annotation: {
      annotations: [
        {
          type: 'box',
          xMin: 0,
          xMax: data.dates.length - 1,
          yMin: 70,
          yMax: 100,
          backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
        },
        {
          type: 'box',
          xMin: 0,
          xMax: data.dates.length - 1,
          yMin: 0,
          yMax: 30,
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.1)",
          borderColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.2)",
        },
      ],
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

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSetupIcon()}
          <h3 className={cn("text-lg font-medium", getSetupColor())}>
            {setupType.charAt(0).toUpperCase() + setupType.slice(1)} Technical Conditions
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
          {/* Main price/EMA chart */}
          <div className="h-[200px] relative rounded-md overflow-hidden border dark:border-zinc-800">
            <Line data={chartData} options={chartOptions} />
          </div>
          
          {/* RSI chart */}
          <div className="h-[80px] relative rounded-md overflow-hidden border dark:border-zinc-800">
            <Line data={rsiChartData} options={rsiChartOptions} />

            {/* RSI labels */}
            <div className="absolute top-1 left-2 text-xs text-red-500">
              Overbought (70)
            </div>
            <div className="absolute bottom-1 left-2 text-xs text-green-500">
              Oversold (30)
            </div>
            <div className="absolute top-1 right-2 text-xs text-purple-500 font-medium">
              RSI: {data.rsi[data.rsi.length - 1].toFixed(1)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Rules checks */}
          <RuleCheckItem
            title="EMA Alignment"
            description={
              setupType === 'bullish' 
                ? "10 EMA > 20 EMA > 50 EMA" 
                : setupType === 'bearish'
                ? "10 EMA < 20 EMA < 50 EMA"
                : "Flat EMAs - no clear trend"
            }
            passed={rules.emaAlignment}
            value={
              `${data.ema10[data.ema10.length - 1].toFixed(1)} / ${data.ema20[data.ema20.length - 1].toFixed(1)} / ${data.ema50[data.ema50.length - 1].toFixed(1)}`
            }
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="RSI Condition"
            description={
              setupType === 'bullish'
                ? "RSI between 55-80"
                : setupType === 'bearish'
                ? "RSI between 20-45"
                : "RSI between 45-55"
            }
            passed={rules.rsiCondition}
            value={`${data.rsi[data.rsi.length - 1].toFixed(1)}`}
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="Volume Trend"
            description={
              setupType === 'bullish'
                ? "Increasing volume on up days"
                : setupType === 'bearish'
                ? "Increasing volume on down days"
                : "Average volume with no clear direction"
            }
            passed={rules.volumeTrend}
            value="15.3% above avg"
            setupType={setupType}
          />
          
          <RuleCheckItem
            title="Price Action"
            description={
              setupType === 'bullish'
                ? "Price above key moving averages"
                : setupType === 'bearish'
                ? "Price below key moving averages"
                : "Price consolidating between EMAs"
            }
            passed={rules.priceBreakout}
            value={
              setupType === 'bullish'
                ? "Above EMAs"
                : setupType === 'bearish'
                ? "Below EMAs"
                : "Between EMAs"
            }
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
                Technical Strategy:
              </span>
            </div>
            <p className="text-sm">
              {setupType === 'bullish'
                ? "Look for entries near 10 EMA support with stops below 20 EMA. Target previous resistance levels with 2:1 reward-to-risk ratio."
                : setupType === 'bearish'
                ? "Short on rallies to 10 EMA with stops above 20 EMA. Target prior support levels with 2:1 reward-to-risk ratio."
                : "Consider range-bound strategies between support and resistance. Use iron condors or straddles/strangles for expected consolidation."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}