"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  ChevronUp, 
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoricalDataPoint {
  date: string;
  close: number;
  ema10: number;
  ema20: number;
  ema50: number;
  volume: number;
  rsi: number;
}

interface KeyLevels {
  support: number[];
  resistance: number[];
  maxPain: number;
}

interface BullishTechnicalChartProps {
  data: HistoricalDataPoint[];
  keyLevels: KeyLevels;
  height?: number;
  className?: string;
}

export default function BullishTechnicalChart({
  data,
  keyLevels,
  height = 350,
  className,
}: BullishTechnicalChartProps) {
  const chartRef = useRef<ChartJS>(null);
  
  // Create gradient for the area chart
  const createGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.5)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.05)");
    return gradient;
  };

  // Create annotation plugin for support and resistance levels
  const supportResistancePlugin = {
    id: 'supportResistanceLines',
    afterDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      if (!ctx || !chartArea || !scales.y) return;
      
      const yScale = scales.y;
      const width = chartArea.right - chartArea.left;
      
      // Draw support levels in green
      keyLevels.support.forEach(level => {
        const y = yScale.getPixelForValue(level);
        
        // Only draw if in the visible area
        if (y >= chartArea.top && y <= chartArea.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          
          // Add a label
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          const label = `S: $${level}`;
          const textWidth = ctx.measureText(label).width + 10;
          ctx.fillRect(chartArea.left, y - 10, textWidth, 20);
          ctx.fillStyle = 'rgba(16, 185, 129, 1)';
          ctx.fillText(label, chartArea.left + 5, y + 4);
          ctx.restore();
        }
      });
      
      // Draw resistance levels in red
      keyLevels.resistance.forEach(level => {
        const y = yScale.getPixelForValue(level);
        
        // Only draw if in the visible area
        if (y >= chartArea.top && y <= chartArea.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          
          // Add a label
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          const label = `R: $${level}`;
          const textWidth = ctx.measureText(label).width + 10;
          ctx.fillRect(chartArea.right - textWidth, y - 10, textWidth, 20);
          ctx.fillStyle = 'rgba(239, 68, 68, 1)';
          ctx.fillText(label, chartArea.right - textWidth + 5, y + 4);
          ctx.restore();
        }
      });
      
      // Draw max pain level in purple
      const maxPainY = yScale.getPixelForValue(keyLevels.maxPain);
      if (maxPainY >= chartArea.top && maxPainY <= chartArea.bottom) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chartArea.left, maxPainY);
        ctx.lineTo(chartArea.right, maxPainY);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.7)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        
        // Add a label
        ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
        const label = `MP: $${keyLevels.maxPain}`;
        const textWidth = ctx.measureText(label).width + 10;
        ctx.fillRect(chartArea.left + width/2 - textWidth/2, maxPainY - 10, textWidth, 20);
        ctx.fillStyle = 'rgba(124, 58, 237, 1)';
        ctx.fillText(label, chartArea.left + width/2 - textWidth/2 + 5, maxPainY + 4);
        ctx.restore();
      }
    }
  };

  // Register the plugin
  ChartJS.register(supportResistancePlugin);

  // Prepare chart data
  const reversedData = [...data].reverse(); // Most recent at the end
  const priceData = reversedData.map(item => item.close);
  const dates = reversedData.map(item => item.date);
  const ema10Data = reversedData.map(item => item.ema10);
  const ema20Data = reversedData.map(item => item.ema20);
  const ema50Data = reversedData.map(item => item.ema50);
  const volumeData = reversedData.map(item => item.volume);
  const rsiData = reversedData.map(item => item.rsi);

  // Calculate price action signals
  const isBullish = priceData[priceData.length - 1] > priceData[priceData.length - 2];
  const isUptrend = ema10Data[ema10Data.length - 1] > ema20Data[ema20Data.length - 1];
  const isStrongUptrend = isUptrend && ema20Data[ema20Data.length - 1] > ema50Data[ema50Data.length - 1];
  const isOverbought = rsiData[rsiData.length - 1] > 70;
  const isOverSold = rsiData[rsiData.length - 1] < 30;
  const volumeIncreasing = volumeData[volumeData.length - 1] > volumeData[volumeData.length - 2];

  // Calculate if price is near a support or resistance level
  const currentPrice = priceData[priceData.length - 1];
  const nearSupport = keyLevels.support.some(level => Math.abs((level / currentPrice) - 1) < 0.02);
  const nearResistance = keyLevels.resistance.some(level => Math.abs((level / currentPrice) - 1) < 0.02);
  const nearMaxPain = Math.abs((keyLevels.maxPain / currentPrice) - 1) < 0.02;

  // Check for bullish confirmation signals
  const hasBullishConfirmation = isBullish && isUptrend && !isOverbought;
  const hasStrongBullishSignal = hasBullishConfirmation && isStrongUptrend && volumeIncreasing;
  
  const chartData: ChartData = {
    labels: dates,
    datasets: [
      {
        type: 'line' as const,
        label: 'Price',
        data: priceData,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx);
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        type: 'line' as const,
        label: '10 EMA',
        data: ema10Data,
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
      },
      {
        type: 'line' as const,
        label: '20 EMA',
        data: ema20Data,
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
      },
      {
        type: 'line' as const,
        label: '50 EMA',
        data: ema50Data,
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
      },
      {
        type: 'bar' as const,
        label: 'Volume',
        data: volumeData,
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        yAxisID: 'y1',
        order: 5,
      },
    ],
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 20,
        bottom: 10,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 10,
          color: (context) => {
            return context.active ? '#ffffff' : '#a1a1aa';
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e4e4e7',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          title: (tooltipItems) => {
            return `Date: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            
            if (label === 'Price') {
              return `${label}: $${context.parsed.y.toFixed(2)}`;
            } else if (label === 'Volume') {
              return `${label}: ${context.parsed.y.toLocaleString()}`;
            } else {
              return `${label}: $${context.parsed.y.toFixed(2)}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          maxRotation: 45,
          minRotation: 45,
          callback: function(value, index, values) {
            // Show fewer ticks for better readability
            return index % 2 === 0 ? this.getLabelForValue(value as number) : '';
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: '#a1a1aa',
        },
      },
      y: {
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(71, 85, 105, 0.15)',
        },
        ticks: {
          color: '#a1a1aa',
        },
        title: {
          display: true,
          text: 'Price ($)',
          color: '#a1a1aa',
        },
      },
      y1: {
        display: true,
        position: 'right',
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          },
        },
        title: {
          display: true,
          text: 'Volume',
          color: '#a1a1aa',
        },
      },
    },
  };

  return (
    <div className={cn("relative", className)}>
      {/* Chart */}
      <div style={{ height }}>
        <Chart 
          ref={chartRef}
          type="line"
          data={chartData}
          options={options}
          plugins={[supportResistancePlugin]}
        />
      </div>

      {/* Bullish Signals Analysis Panel */}
      <div className="mt-4 p-4 rounded-md border bg-zinc-50 dark:bg-zinc-900">
        <h3 className="text-lg font-medium flex items-center mb-3">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Bullish Technical Analysis
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Signal indicators */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Trend Status:</span>
              <Badge variant={isStrongUptrend ? "default" : isUptrend ? "outline" : "secondary"}>
                {isStrongUptrend ? 'Strong Uptrend' : isUptrend ? 'Uptrend' : 'Neutral/Downtrend'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">RSI (14):</span>
              <Badge variant={isOverbought ? "destructive" : isOverSold ? "default" : "outline"}>
                {rsiData[rsiData.length - 1].toFixed(1)} {isOverbought ? '(Overbought)' : isOverSold ? '(Oversold)' : ''}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Volume Trend:</span>
              <Badge variant={volumeIncreasing ? "default" : "secondary"}>
                {volumeIncreasing ? 'Increasing' : 'Decreasing'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Recent Price Action:</span>
              <span className={cn(
                "text-sm font-medium flex items-center",
                isBullish ? "text-green-500" : "text-red-500"
              )}>
                {isBullish ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
          </div>
          
          {/* Key level proximity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Support Proximity:</span>
              <Badge variant={nearSupport ? "default" : "outline"} className={nearSupport ? "bg-green-500" : ""}>
                {nearSupport ? 'Near Support' : 'No Close Support'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Resistance Proximity:</span>
              <Badge variant={nearResistance ? "destructive" : "outline"}>
                {nearResistance ? 'Near Resistance' : 'No Close Resistance'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Max Pain Proximity:</span>
              <Badge variant={nearMaxPain ? "secondary" : "outline"} className={nearMaxPain ? "bg-purple-500 hover:bg-purple-600" : ""}>
                {nearMaxPain ? 'Near Max Pain' : 'Away from Max Pain'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Signal:</span>
              <Badge variant={hasStrongBullishSignal ? "default" : hasBullishConfirmation ? "outline" : "secondary"}
                     className={hasStrongBullishSignal ? "bg-green-500 hover:bg-green-600" : ""}>
                {hasStrongBullishSignal ? 'Strong Bullish' : hasBullishConfirmation ? 'Bullish' : 'Neutral/Bearish'}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Signal explanation */}
        <div className="mt-4 p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-sm">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              {hasStrongBullishSignal 
                ? 'Strong bullish confirmation with uptrending EMAs, increasing volume, and positive price action. Risk/reward favorable for bullish trades.'
                : hasBullishConfirmation
                  ? 'Bullish signals present but lacking key confirmation. Consider bullish trades with tighter risk management.'
                  : 'Mixed or bearish signals present. Either wait for clearer bullish setup or consider bearish strategies.'}
              {nearSupport && ' Price is near support, which may provide a favorable entry point.'}
              {nearResistance && ' Be cautious as price is approaching resistance, which may limit upside potential.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}