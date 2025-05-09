"use client";

import { useEffect, useState, useRef } from "react";
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
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { RefreshCw, Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

interface DataPoint {
  date: string;
  rsi: number;
  stochRsi?: number;
}

interface EnhancedRsiChartProps {
  data: DataPoint[];
  height?: number;
  title?: string;
  showStochRsi?: boolean;
  isLoading?: boolean;
  className?: string;
  showAnimation?: boolean;
}

export default function EnhancedRsiChart({
  data,
  height = 200,
  title = "RSI Analysis",
  showStochRsi = false,
  isLoading = false,
  className,
  showAnimation = true,
}: EnhancedRsiChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const chartRef = useRef<ChartJS<"line">>(null);
  
  // RSI zones plugin - draws colored background zones for overbought/oversold regions
  const rsiZonesPlugin = {
    id: 'rsiZones',
    beforeDraw: (chart: any) => {
      if (!chart.ctx) return;
      
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const xAxis = chart.scales.x;
      
      if (!xAxis || !yAxis) return;
      
      const chartArea = chart.chartArea;
      
      // Overbought zone (70-100)
      const overboughtTop = yAxis.getPixelForValue(100);
      const overboughtBottom = yAxis.getPixelForValue(70);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(chartArea.left, overboughtTop, chartArea.right - chartArea.left, overboughtBottom - overboughtTop);
      
      // Neutral zone (30-70)
      const neutralTop = yAxis.getPixelForValue(70);
      const neutralBottom = yAxis.getPixelForValue(30);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(chartArea.left, neutralTop, chartArea.right - chartArea.left, neutralBottom - neutralTop);
      
      // Oversold zone (0-30)
      const oversoldTop = yAxis.getPixelForValue(30);
      const oversoldBottom = yAxis.getPixelForValue(0);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.fillRect(chartArea.left, oversoldTop, chartArea.right - chartArea.left, oversoldBottom - oversoldTop);
      
      // Draw zone labels
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Overbought', chartArea.left + 5, overboughtTop + (overboughtBottom - overboughtTop) / 2);
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.fillText('Oversold', chartArea.left + 5, oversoldTop + (oversoldBottom - oversoldTop) / 2);
      ctx.restore();
      
      // Draw horizontal lines at 30 and 70
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(chartArea.left, yAxis.getPixelForValue(70));
      ctx.lineTo(chartArea.right, yAxis.getPixelForValue(70));
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(chartArea.left, yAxis.getPixelForValue(30));
      ctx.lineTo(chartArea.right, yAxis.getPixelForValue(30));
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.restore();
      
      // Draw midline at 50
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(chartArea.left, yAxis.getPixelForValue(50));
      ctx.lineTo(chartArea.right, yAxis.getPixelForValue(50));
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.restore();
      
      // Show hover info if a point is hovered
      if (hoveredPoint !== null && hoveredPoint >= 0 && hoveredPoint < data.length) {
        const x = xAxis.getPixelForValue(hoveredPoint);
        
        // Draw vertical line at hovered point
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // Register the plugins
  ChartJS.register(rsiZonesPlugin);
  
  // Calculate RSI status
  const getRsiStatus = () => {
    if (data.length === 0) return { status: 'neutral', value: 0 };
    
    const lastRsi = data[data.length - 1].rsi;
    
    if (lastRsi > 70) {
      return { status: 'overbought', value: lastRsi };
    } else if (lastRsi < 30) {
      return { status: 'oversold', value: lastRsi };
    } else {
      return { status: 'neutral', value: lastRsi };
    }
  };
  
  // Detect RSI divergence
  const detectDivergence = () => {
    if (data.length < 10) return null;
    
    const recentData = data.slice(-10);
    
    // Price highs/lows from main chart data would be needed here
    // This is a simplified check that just looks at RSI trends
    const rsiTrend = recentData[recentData.length - 1].rsi - recentData[0].rsi;
    
    // In a real implementation, we'd compare price action with RSI action
    // For now, return a dummy value based on RSI trend
    if (rsiTrend > 5 && recentData[recentData.length - 1].rsi < 50) {
      return { type: 'bullish', strength: 'moderate' };
    } else if (rsiTrend < -5 && recentData[recentData.length - 1].rsi > 50) {
      return { type: 'bearish', strength: 'moderate' };
    }
    
    return null;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: showAnimation ? {
      duration: 800,
      easing: 'easeOutQuart',
    } : false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          color: '#a1a1aa',
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#e4e4e7',
        font: {
          size: 14,
          weight: 'normal',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e4e4e7',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (tooltipItems) => {
            return data[tooltipItems[0].dataIndex].date;
          },
          label: (context) => {
            const index = context.dataIndex;
            const point = data[index];
            const label = context.dataset.label || '';
            
            return `${label}: ${context.raw as number}`;
          },
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const rsi = data[index].rsi;
            
            let status = 'Neutral';
            if (rsi > 70) status = 'Overbought';
            else if (rsi < 30) status = 'Oversold';
            
            return [`Status: ${status}`];
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        border: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 6,
          callback: function(value: any, index: number) {
            const dataIndex = Number(value);
            if (dataIndex >= 0 && dataIndex < data.length) {
              // Show fewer x-axis labels for better readability
              const step = Math.ceil(data.length / 6);
              if (index % step === 0) {
                return data[dataIndex].date;
              }
            }
            return '';
          },
        },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        border: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
        },
        title: {
          display: false,
        },
      },
    },
    onHover: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        setHoveredPoint(elements[0].index);
      } else {
        setHoveredPoint(null);
      }
    },
  };

  const chartData = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        label: "RSI",
        data: data.map(point => point.rsi),
        borderColor: "rgb(124, 58, 237)",
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
      },
      ...(showStochRsi && data[0]?.stochRsi !== undefined ? [{
        label: "Stochastic RSI",
        data: data.map(point => point.stochRsi || 0),
        borderColor: "rgb(14, 165, 233)",
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderDash: [5, 5],
        tension: 0.3,
      }] : []),
    ],
  };

  const rsiStatus = getRsiStatus();
  const divergence = detectDivergence();

  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {title}
          </h4>
          <Badge variant={
            rsiStatus.status === 'overbought' ? "destructive" : 
            rsiStatus.status === 'oversold' ? "success" : 
            "outline"
          }>
            {rsiStatus.status.charAt(0).toUpperCase() + rsiStatus.status.slice(1)} ({rsiStatus.value.toFixed(1)})
          </Badge>
          
          {divergence && (
            <Badge variant={divergence.type === 'bullish' ? "success" : "destructive"} className="ml-2">
              {divergence.type === 'bullish' ? 'Bullish' : 'Bearish'} Divergence
            </Badge>
          )}
        </div>
        
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex h-6 w-6 items-center justify-center rounded-md text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center" className="w-80">
              <div className="text-sm">
                <p className="font-medium">Relative Strength Index (RSI)</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  RSI measures momentum on a scale of 0 to 100. Values above 70 indicate overbought conditions (potential reversal lower), while values below 30 indicate oversold conditions (potential reversal higher). The 50 level represents neutral momentum.
                </p>
                
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <span className="h-2 w-6 rounded-sm bg-red-500 opacity-30 mr-2"></span>
                    <span className="text-xs">70-100: Overbought Zone</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-2 w-6 rounded-sm bg-green-500 opacity-30 mr-2"></span>
                    <span className="text-xs">0-30: Oversold Zone</span>
                  </div>
                </div>
                
                {divergence && (
                  <p className="mt-2 text-xs">
                    <span className="font-medium">Divergence Detected:</span> {divergence.type === 'bullish' ? 'Bullish' : 'Bearish'} divergence occurs when price and RSI trend in opposite directions, suggesting a potential trend change.
                  </p>
                )}
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      <div className="relative" style={{ height }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/80 dark:bg-zinc-900/80 z-10 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center">
              <RefreshCw size={20} className="animate-spin text-zinc-500 dark:text-zinc-400" />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Loading RSI data...</p>
            </div>
          </div>
        ) : null}
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={`rsi-${showStochRsi ? 'stoch' : 'regular'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Line ref={chartRef} options={options} data={chartData} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}