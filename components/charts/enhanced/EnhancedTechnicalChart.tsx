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
  ScriptableContext,
  ChartOptions,
  ChartData,
  BarElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Info, 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // For volume
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  ema10: number;
  ema20: number;
  ema50: number;
  volume: number;
  rsi: number;
  stochRsi?: number;
}

interface SignalPoint {
  date: string;
  price: number;
  type: 'bullish' | 'bearish' | 'neutral';
  label: string;
  description?: string;
}

interface EnhancedTechnicalChartProps {
  data: DataPoint[];
  height?: number;
  title?: string;
  showVolume?: boolean;
  showEma?: boolean;
  showRsi?: boolean;
  signals?: SignalPoint[];
  isLoading?: boolean;
  className?: string;
  symbol?: string;
  onZoom?: (range: [string, string]) => void;
  showAnimation?: boolean;
  annotations?: {
    trendLines?: {
      startIndex: number;
      endIndex: number;
      label?: string;
      color?: string;
    }[];
    horizontalLines?: {
      value: number;
      label: string;
      color?: string;
      style?: 'dashed' | 'solid';
    }[];
  };
}

export default function EnhancedTechnicalChart({
  data,
  height = 400,
  title = "Price & Technical Analysis",
  showVolume = true,
  showEma = true,
  showRsi = false,
  signals = [],
  isLoading = false,
  className,
  symbol = "TSLA",
  onZoom,
  showAnimation = true,
  annotations,
}: EnhancedTechnicalChartProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = full chart, higher numbers = more zoomed in
  const [panPosition, setPanPosition] = useState<number>(0); // 0 = start, 1 = end
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [displayedData, setDisplayedData] = useState<DataPoint[]>(data);
  const [selectedEmas, setSelectedEmas] = useState<('ema10' | 'ema20' | 'ema50')[]>(['ema10', 'ema20', 'ema50']);
  const [chartInstance, setChartInstance] = useState<ChartJS<"line"> | null>(null);
  const chartRef = useRef<ChartJS<"line">>(null);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [chartRange, setChartRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('3m');
  
  // Update displayed data when main data changes
  useEffect(() => {
    updateDisplayedData();
  }, [data, zoomLevel, panPosition, chartRange]);

  // Calculate trend strength based on EMA alignment
  const getTrendStrength = () => {
    const lastPoint = data[data.length - 1];
    if (!lastPoint) return { strength: 'neutral', value: 0 };
    
    // Calculate EMA alignment
    const ema10 = lastPoint.ema10;
    const ema20 = lastPoint.ema20;
    const ema50 = lastPoint.ema50;
    
    if (ema10 > ema20 && ema20 > ema50) {
      const strength = (ema10 - ema50) / ema50 * 100;
      return { strength: 'bullish', value: strength };
    } else if (ema10 < ema20 && ema20 < ema50) {
      const strength = (ema50 - ema10) / ema50 * 100;
      return { strength: 'bearish', value: strength };
    } else {
      // Calculate how close the EMAs are to each other
      const avgEma = (ema10 + ema20 + ema50) / 3;
      const variance = Math.sqrt(
        (Math.pow(ema10 - avgEma, 2) + 
         Math.pow(ema20 - avgEma, 2) + 
         Math.pow(ema50 - avgEma, 2)) / 3
      );
      const relativeVariance = variance / avgEma * 100;
      
      return { strength: 'neutral', value: relativeVariance };
    }
  };

  // Update displayed data based on zoom and pan
  const updateDisplayedData = () => {
    if (data.length === 0) return;
    
    let filteredData = [...data];
    
    // Apply date range filter
    if (chartRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (chartRange) {
        case '1m':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startDate = new Date();
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      filteredData = data.filter(point => new Date(point.date) >= startDate);
    }
    
    // Apply zoom and pan
    if (zoomLevel > 1 && filteredData.length > 0) {
      const visiblePoints = Math.ceil(filteredData.length / zoomLevel);
      const maxStartIndex = filteredData.length - visiblePoints;
      const startIndex = Math.floor(panPosition * maxStartIndex);
      
      filteredData = filteredData.slice(startIndex, startIndex + visiblePoints);
    }
    
    setDisplayedData(filteredData);
    
    // Call onZoom callback if provided
    if (onZoom && filteredData.length > 0) {
      onZoom([filteredData[0].date, filteredData[filteredData.length - 1].date]);
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  // Handle reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition(0);
  };

  // Toggle EMA visibility
  const toggleEma = (ema: 'ema10' | 'ema20' | 'ema50') => {
    setSelectedEmas(prev => {
      if (prev.includes(ema)) {
        return prev.filter(e => e !== ema);
      } else {
        return [...prev, ema];
      }
    });
  };

  // Custom annotations plugin
  const annotationsPlugin = {
    id: 'annotationsPlugin',
    afterDraw: (chart: any) => {
      if (!chart.ctx || !annotations) return;
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      if (!xAxis || !yAxis) return;
      
      // Draw trend lines
      if (annotations.trendLines) {
        annotations.trendLines.forEach(line => {
          if (line.startIndex >= 0 && line.startIndex < displayedData.length && 
              line.endIndex >= 0 && line.endIndex < displayedData.length) {
            
            const startX = xAxis.getPixelForValue(line.startIndex);
            const startY = yAxis.getPixelForValue(displayedData[line.startIndex].close);
            const endX = xAxis.getPixelForValue(line.endIndex);
            const endY = yAxis.getPixelForValue(displayedData[line.endIndex].close);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = line.color || 'rgba(255, 99, 132, 0.8)';
            ctx.stroke();
            
            // Add label if provided
            if (line.label) {
              const labelX = (startX + endX) / 2;
              const labelY = (startY + endY) / 2 - 10;
              
              ctx.fillStyle = line.color || 'rgba(255, 99, 132, 1)';
              ctx.textAlign = 'center';
              ctx.fillText(line.label, labelX, labelY);
            }
            
            ctx.restore();
          }
        });
      }
      
      // Draw horizontal lines
      if (annotations.horizontalLines) {
        annotations.horizontalLines.forEach(line => {
          const y = yAxis.getPixelForValue(line.value);
          
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xAxis.left, y);
          ctx.lineTo(xAxis.right, y);
          ctx.lineWidth = 1;
          ctx.strokeStyle = line.color || 'rgba(75, 192, 192, 0.8)';
          
          if (line.style === 'dashed') {
            ctx.setLineDash([4, 4]);
          }
          
          ctx.stroke();
          
          // Add label
          ctx.fillStyle = line.color || 'rgba(75, 192, 192, 1)';
          ctx.textAlign = 'left';
          ctx.fillText(`${line.label} (${line.value.toFixed(2)})`, xAxis.left + 5, y - 5);
          
          ctx.restore();
        });
      }
      
      // Draw signals if enabled
      if (showSignals && signals && signals.length > 0) {
        signals.forEach(signal => {
          const signalDate = signal.date;
          const dateIndex = displayedData.findIndex(point => point.date === signalDate);
          
          if (dateIndex >= 0) {
            const x = xAxis.getPixelForValue(dateIndex);
            const y = yAxis.getPixelForValue(signal.price);
            
            ctx.save();
            
            // Draw different markers based on signal type
            if (signal.type === 'bullish') {
              // Bullish triangle
              ctx.beginPath();
              ctx.moveTo(x, y - 12);
              ctx.lineTo(x - 8, y);
              ctx.lineTo(x + 8, y);
              ctx.closePath();
              ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
              ctx.fill();
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(16, 185, 129, 1)';
              ctx.stroke();
            } else if (signal.type === 'bearish') {
              // Bearish triangle
              ctx.beginPath();
              ctx.moveTo(x, y + 12);
              ctx.lineTo(x - 8, y);
              ctx.lineTo(x + 8, y);
              ctx.closePath();
              ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
              ctx.fill();
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(239, 68, 68, 1)';
              ctx.stroke();
            } else {
              // Neutral diamond
              ctx.beginPath();
              ctx.moveTo(x, y - 8);
              ctx.lineTo(x + 8, y);
              ctx.lineTo(x, y + 8);
              ctx.lineTo(x - 8, y);
              ctx.closePath();
              ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
              ctx.fill();
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
              ctx.stroke();
            }
            
            ctx.restore();
          }
        });
      }
      
      // Show hover info if a point is hovered
      if (hoveredPoint !== null && hoveredPoint >= 0 && hoveredPoint < displayedData.length) {
        const point = displayedData[hoveredPoint];
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

  // Register plugins
  ChartJS.register(annotationsPlugin);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: showAnimation ? {
      duration: 800,
      easing: 'easeOutQuart',
    } : false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          color: (context) => {
            return context.active ? '#ffffff' : '#a1a1aa';
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#e4e4e7',
        font: {
          size: 16,
          weight: 'bold',
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
            return displayedData[tooltipItems[0].dataIndex].date;
          },
          label: (context) => {
            const index = context.dataIndex;
            const point = displayedData[index];
            const label = context.dataset.label || '';
            
            if (label === 'Price') {
              return `${label}: $${context.raw as number}`;
            } else if (label === 'Volume') {
              const volume = context.raw as number;
              return `${label}: ${volume >= 1000000 
                ? (volume / 1000000).toFixed(2) + 'M' 
                : (volume / 1000).toFixed(2) + 'K'}`;
            } else if (label === 'RSI') {
              return `${label}: ${context.raw as number}`;
            } else {
              return `${label}: $${context.raw as number}`;
            }
          },
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const point = displayedData[index];
            
            // Find if there's a signal on this date
            const dateSignals = signals.filter(s => s.date === point.date);
            
            const lines = [];
            
            // Add OHLC data
            lines.push(`Open: $${point.open.toFixed(2)}`);
            lines.push(`High: $${point.high.toFixed(2)}`);
            lines.push(`Low: $${point.low.toFixed(2)}`);
            
            // Add signal information if any
            if (dateSignals.length > 0) {
              lines.push('');
              lines.push('Signals:');
              dateSignals.forEach(signal => {
                lines.push(`- ${signal.label}`);
                if (signal.description) {
                  lines.push(`  ${signal.description}`);
                }
              });
            }
            
            return lines;
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
          maxTicksLimit: 8,
          callback: function(value, index) {
            const dataIndex = Number(value);
            if (dataIndex >= 0 && dataIndex < displayedData.length) {
              // Adjust label density based on zoom level
              const step = Math.ceil(displayedData.length / 8);
              if (index % step === 0) {
                return displayedData[dataIndex].date;
              }
            }
            return '';
          },
        },
      },
      y: {
        display: true,
        position: 'right',
        border: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.15)',
        },
        ticks: {
          color: '#a1a1aa',
        },
        title: {
          display: true,
          text: "Price ($)",
          color: '#a1a1aa',
        },
      },
      volume: {
        type: 'linear',
        display: showVolume,
        position: 'left',
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          callback: function(value) {
            const num = Number(value);
            if (num >= 1000000) {
              return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
              return (num / 1000).toFixed(1) + 'K';
            }
            return num;
          },
        },
        title: {
          display: true,
          text: "Volume",
          color: '#a1a1aa',
        },
      },
      rsi: {
        type: 'linear',
        display: showRsi,
        position: 'right',
        min: 0,
        max: 100,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
        },
        title: {
          display: true,
          text: "RSI",
          color: '#a1a1aa',
        },
      },
    },
    onHover: (_, elements) => {
      if (elements.length > 0) {
        setHoveredPoint(elements[0].index);
      } else {
        setHoveredPoint(null);
      }
    },
  };

  const chartData: ChartData<"line"> = {
    labels: displayedData.map((_, index) => index.toString()),
    datasets: [
      // Price line
      {
        label: "Price",
        data: displayedData.map(point => point.close),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
          return gradient;
        },
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(59, 130, 246)",
        pointHoverBorderColor: "rgb(255, 255, 255)",
        pointHoverBorderWidth: 2,
        yAxisID: 'y',
      },
      // Volume bars (using line chart with custom drawing)
      ...(showVolume ? [{
        label: "Volume",
        data: displayedData.map(point => point.volume),
        borderColor: "rgba(148, 163, 184, 0)",
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 150);
          gradient.addColorStop(0, "rgba(148, 163, 184, 0.7)");
          gradient.addColorStop(1, "rgba(148, 163, 184, 0.1)");
          return gradient;
        },
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        yAxisID: 'volume',
        type: 'bar' as const,
      }] : []),
      // EMA lines
      ...(showEma && selectedEmas.includes('ema10') ? [{
        label: "EMA 10",
        data: displayedData.map(point => point.ema10),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y',
      }] : []),
      ...(showEma && selectedEmas.includes('ema20') ? [{
        label: "EMA 20",
        data: displayedData.map(point => point.ema20),
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y',
      }] : []),
      ...(showEma && selectedEmas.includes('ema50') ? [{
        label: "EMA 50",
        data: displayedData.map(point => point.ema50),
        borderColor: "rgb(124, 58, 237)",
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y',
      }] : []),
      // RSI line
      ...(showRsi ? [{
        label: "RSI",
        data: displayedData.map(point => point.rsi),
        borderColor: "rgb(234, 179, 8)",
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'rsi',
      }] : []),
    ],
  };

  // Get the trend strength indicator
  const trendStrength = getTrendStrength();

  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", className)}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              {symbol}
              <Badge variant={
                trendStrength.strength === 'bullish' ? "success" : 
                trendStrength.strength === 'bearish' ? "destructive" : 
                "outline"
              } className="ml-2">
                {trendStrength.strength === 'bullish' ? 
                  <TrendingUp className="mr-1 h-3 w-3" /> : 
                  trendStrength.strength === 'bearish' ? 
                  <TrendingDown className="mr-1 h-3 w-3" /> : 
                  null}
                {trendStrength.strength.charAt(0).toUpperCase() + trendStrength.strength.slice(1)}
              </Badge>
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date range selector */}
            <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
              {(['1m', '3m', '6m', '1y', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={cn(
                    "inline-flex h-8 items-center justify-center px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                    chartRange === range
                      ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Chart controls */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                        zoomLevel > 1
                          ? "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                          : "text-zinc-400 dark:text-zinc-600"
                      )}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Zoom out</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 4}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                        zoomLevel < 4
                          ? "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                          : "text-zinc-400 dark:text-zinc-600"
                      )}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Zoom in</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleResetZoom}
                      disabled={zoomLevel === 1 && panPosition === 0}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                        (zoomLevel > 1 || panPosition > 0)
                          ? "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                          : "text-zinc-400 dark:text-zinc-600"
                      )}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Reset view</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50">
                    <Layers className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52" side="bottom" align="end">
                  <div className="space-y-1.5 p-1">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Chart Elements
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleEma('ema10')}
                        className={cn(
                          "flex w-full items-center py-1 px-2 rounded-md text-left text-sm",
                          selectedEmas.includes('ema10')
                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div className="mr-2 h-2 w-4 rounded-sm bg-green-500"></div>
                        EMA 10
                      </button>
                      <button
                        onClick={() => toggleEma('ema20')}
                        className={cn(
                          "flex w-full items-center py-1 px-2 rounded-md text-left text-sm",
                          selectedEmas.includes('ema20')
                            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div className="mr-2 h-2 w-4 rounded-sm bg-orange-500"></div>
                        EMA 20
                      </button>
                      <button
                        onClick={() => toggleEma('ema50')}
                        className={cn(
                          "flex w-full items-center py-1 px-2 rounded-md text-left text-sm",
                          selectedEmas.includes('ema50')
                            ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div className="mr-2 h-2 w-4 rounded-sm bg-purple-500"></div>
                        EMA 50
                      </button>
                    </div>
                    <Separator />
                    <button
                      onClick={() => setShowSignals(!showSignals)}
                      className={cn(
                        "flex w-full items-center py-1 px-2 rounded-md text-left text-sm",
                        showSignals
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                      Show Signals
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" className="w-80">
                    <div className="text-sm">
                      <p className="font-medium">Chart Legend</p>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-center">
                          <span className="h-2 w-6 rounded-sm bg-blue-500 mr-2"></span>
                          <span>Price</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-2 w-6 rounded-sm bg-green-500 mr-2"></span>
                          <span>EMA 10</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-2 w-6 rounded-sm bg-orange-500 mr-2"></span>
                          <span>EMA 20</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-2 w-6 rounded-sm bg-purple-500 mr-2"></span>
                          <span>EMA 50</span>
                        </li>
                      </ul>
                      {signals.length > 0 && (
                        <>
                          <p className="font-medium mt-3">Signal Types</p>
                          <ul className="mt-2 space-y-1">
                            <li className="flex items-center">
                              <span className="h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-green-500 mr-2"></span>
                              <span>Bullish Signal</span>
                            </li>
                            <li className="flex items-center">
                              <span className="h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-red-500 mr-2"></span>
                              <span>Bearish Signal</span>
                            </li>
                            <li className="flex items-center">
                              <span className="h-4 w-4 rotate-45 bg-blue-500 mr-2"></span>
                              <span>Neutral Signal</span>
                            </li>
                          </ul>
                        </>
                      )}
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Hover over chart for detailed data. Use zoom controls to focus on specific periods.</p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        {zoomLevel > 1 && (
          <div className="px-2">
            <input
              type="range"
              value={panPosition}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => setPanPosition(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="relative mt-4" style={{ height }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/80 dark:bg-zinc-900/80 z-10 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center">
              <RefreshCw size={24} className="animate-spin text-zinc-500 dark:text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading chart data...</p>
            </div>
          </div>
        ) : null}
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${chartRange}-${zoomLevel}-${selectedEmas.join('-')}-${showRsi ? 1 : 0}-${showVolume ? 1 : 0}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Line
              ref={chartRef}
              options={options}
              data={chartData}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Optional bottom stats display */}
      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Price Range (Period)</div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            ${Math.min(...displayedData.map(d => d.low)).toFixed(2)} - ${Math.max(...displayedData.map(d => d.high)).toFixed(2)}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Volatility</div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {((Math.max(...displayedData.map(d => d.high)) - Math.min(...displayedData.map(d => d.low))) / 
              (displayedData.reduce((sum, d) => sum + d.close, 0) / displayedData.length) * 100).toFixed(2)}%
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Latest RSI</div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {displayedData.length > 0 ? displayedData[displayedData.length - 1].rsi.toFixed(2) : 'N/A'}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Signal Count</div>
          <div className="text-sm font-medium flex items-center">
            <span className="text-green-600 dark:text-green-400">
              {signals.filter(s => s.type === 'bullish').length}↑
            </span>
            <span className="mx-1 text-zinc-400">|</span>
            <span className="text-red-600 dark:text-red-400">
              {signals.filter(s => s.type === 'bearish').length}↓
            </span>
            <span className="mx-1 text-zinc-400">|</span>
            <span className="text-blue-600 dark:text-blue-400">
              {signals.filter(s => s.type === 'neutral').length}◆
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}