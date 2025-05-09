"use client";

import { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Target,
  Info 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Gradient & pattern utils for enhanced visuals
const getGradient = (ctx: CanvasRenderingContext2D, chartArea: any, startColor: string, endColor: string) => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
};

// Define the Strike interface for options chain data
interface Strike {
  strike: number;
  call: {
    oi: number;
    volume: number;
    iv: number;
    gamma: number;
  };
  put: {
    oi: number;
    volume: number;
    iv: number;
    gamma: number;
  };
}

interface EnhancedOptionsChainProps {
  data: Strike[];
  currentPrice: number;
  maxPain: number;
  height?: number;
  title?: string;
  displayMode?: 'openInterest' | 'volume' | 'gamma';
  isLoading?: boolean;
  className?: string;
  onStrikeClick?: (strike: Strike) => void;
  showAnimation?: boolean;
}

export default function EnhancedOptionsChain({
  data,
  currentPrice,
  maxPain,
  height = 400,
  title = "Options Chain Analysis",
  displayMode = 'openInterest',
  isLoading = false,
  className,
  onStrikeClick,
  showAnimation = true,
}: EnhancedOptionsChainProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [chartInstance, setChartInstance] = useState<ChartJS<"bar"> | null>(null);
  const chartRef = useRef<ChartJS<"bar">>(null);
  const [activeDisplayMode, setActiveDisplayMode] = useState(displayMode);
  const [showNotableStrikes, setShowNotableStrikes] = useState(true);
  
  // Calculate important values for annotations
  const inTheMoney = data.filter(d => d.strike <= currentPrice);
  const outOfTheMoney = data.filter(d => d.strike > currentPrice);
  
  // Find strike with highest call OI
  const highestCallOI = Math.max(...data.map(d => d.call.oi));
  const highestCallOIStrike = data.find(d => d.call.oi === highestCallOI)?.strike || 0;
  
  // Find strike with highest put OI
  const highestPutOI = Math.max(...data.map(d => d.put.oi));
  const highestPutOIStrike = data.find(d => d.put.oi === highestPutOI)?.strike || 0;
  
  // Find strike with highest gamma
  const highestCallGamma = Math.max(...data.map(d => d.call.gamma));
  const highestCallGammaStrike = data.find(d => d.call.gamma === highestCallGamma)?.strike || 0;
  
  // Find strike with highest put gamma
  const highestPutGamma = Math.max(...data.map(d => d.put.gamma));
  const highestPutGammaStrike = data.find(d => d.put.gamma === highestPutGamma)?.strike || 0;

  // Create a plugin for drawing vertical lines for current price and max pain
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart: any) => {
      if (chart.tooltip?._active?.length || !chart.ctx) {
        return;
      }
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      if (!xAxis || !yAxis) return;
      
      // Current price line
      const currentPriceIndex = data.findIndex(d => d.strike >= currentPrice);
      if (currentPriceIndex > 0) {
        const ratio = (currentPrice - data[currentPriceIndex - 1].strike) / 
                      (data[currentPriceIndex].strike - data[currentPriceIndex - 1].strike);
        const currentPriceX = xAxis.getPixelForValue(currentPriceIndex - 1) + 
                             (xAxis.getPixelForValue(currentPriceIndex) - 
                              xAxis.getPixelForValue(currentPriceIndex - 1)) * ratio;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(currentPriceX, yAxis.top);
        ctx.lineTo(currentPriceX, yAxis.bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.restore();
        
        // Current price label with semi-transparent background
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        const textWidth = ctx.measureText(`$${currentPrice.toFixed(2)}`).width + 10;
        ctx.fillRect(currentPriceX - textWidth/2, yAxis.top - 25, textWidth, 20);
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
        ctx.textAlign = 'center';
        ctx.fillText(`$${currentPrice.toFixed(2)}`, currentPriceX, yAxis.top - 10);
        ctx.restore();
      }
      
      // Max pain line
      const maxPainIndex = data.findIndex(d => d.strike >= maxPain);
      if (maxPainIndex > 0) {
        const maxPainRatio = (maxPain - data[maxPainIndex - 1].strike) / 
                            (data[maxPainIndex].strike - data[maxPainIndex - 1].strike);
        const maxPainX = xAxis.getPixelForValue(maxPainIndex - 1) + 
                        (xAxis.getPixelForValue(maxPainIndex) - 
                         xAxis.getPixelForValue(maxPainIndex - 1)) * maxPainRatio;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(maxPainX, yAxis.top);
        ctx.lineTo(maxPainX, yAxis.bottom);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.8)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();
        
        // Max pain label with semi-transparent background
        ctx.save();
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        const textWidth = ctx.measureText('Max Pain').width + 10;
        ctx.fillRect(maxPainX - textWidth/2, yAxis.top - 45, textWidth, 20);
        ctx.fillStyle = 'rgba(124, 58, 237, 1)';
        ctx.textAlign = 'center';
        ctx.fillText('Max Pain', maxPainX, yAxis.top - 30);
        ctx.restore();
      }
      
      // Draw notable strikes if enabled
      if (showNotableStrikes) {
        // Highest Call OI
        const highestCallIndex = data.findIndex(d => d.strike === highestCallOIStrike);
        if (highestCallIndex >= 0) {
          const highestCallX = xAxis.getPixelForValue(highestCallIndex);
          
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(highestCallX, yAxis.top);
          ctx.lineTo(highestCallX, yAxis.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }
        
        // Highest Put OI
        const highestPutIndex = data.findIndex(d => d.strike === highestPutOIStrike);
        if (highestPutIndex >= 0) {
          const highestPutX = xAxis.getPixelForValue(highestPutIndex);
          
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(highestPutX, yAxis.top);
          ctx.lineTo(highestPutX, yAxis.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }
      }
      
      // Highlight selected bar if any
      if (highlightedIndex !== null) {
        const highlightX = xAxis.getPixelForValue(highlightedIndex);
        const barWidth = xAxis.getPixelForValue(1) - xAxis.getPixelForValue(0);
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(highlightX - barWidth/2, yAxis.top, barWidth, yAxis.bottom - yAxis.top);
        ctx.restore();
      }
    }
  };

  // Register the plugin
  ChartJS.register(verticalLinePlugin);

  // Update chart on display mode change
  useEffect(() => {
    setActiveDisplayMode(displayMode);
  }, [displayMode]);

  // Get the appropriate title based on display mode
  const getDisplayTitle = () => {
    switch (activeDisplayMode) {
      case 'openInterest':
        return 'Open Interest';
      case 'volume':
        return 'Volume';
      case 'gamma':
        return 'Gamma Exposure';
      default:
        return 'Open Interest';
    }
  };

  // Get the appropriate data based on display mode
  const getDataByMode = (strike: Strike) => {
    switch (activeDisplayMode) {
      case 'openInterest':
        return { call: strike.call.oi, put: strike.put.oi };
      case 'volume':
        return { call: strike.call.volume, put: strike.put.volume };
      case 'gamma':
        return { call: strike.call.gamma * 1000, put: strike.put.gamma * 1000 }; // Scaling for visibility
      default:
        return { call: strike.call.oi, put: strike.put.oi };
    }
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: showAnimation ? {
      duration: 800,
      easing: 'easeOutQuart',
    } : false,
    plugins: {
      legend: {
        position: "top" as const,
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
          title: (items) => {
            if (!items.length) return '';
            const index = parseInt(items[0].label);
            return `Strike: $${data[index].strike.toFixed(2)}`;
          },
          label: (context) => {
            const index = parseInt(context.label);
            const strike = data[index];
            const displayData = getDataByMode(strike);
            
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            
            let mainValue = '';
            switch (activeDisplayMode) {
              case 'openInterest':
                mainValue = `${datasetLabel}: ${value.toLocaleString()}`;
                break;
              case 'volume':
                mainValue = `${datasetLabel}: ${value.toLocaleString()}`;
                break;
              case 'gamma':
                mainValue = `${datasetLabel}: ${(value / 1000).toFixed(4)}`; // Unscale for display
                break;
            }
            
            return mainValue;
          },
          afterLabel: (context) => {
            const index = parseInt(context.label);
            const strike = data[index];
            
            // Calculate put-call ratio for this strike
            const pcr = strike.put.oi / (strike.call.oi || 1);
            
            // Calculate distance from current price as percentage
            const distanceFromPrice = ((strike.strike - currentPrice) / currentPrice) * 100;
            
            const lines = [
              `IV: ${(context.datasetIndex === 0 ? strike.call.iv : strike.put.iv).toFixed(2)}%`,
              `PCR: ${pcr.toFixed(2)}`,
              `${Math.abs(distanceFromPrice).toFixed(1)}% ${distanceFromPrice >= 0 ? 'OTM' : 'ITM'}`
            ];
            
            return lines;
          },
        },
      },
    },
    scales: {
      y: {
        display: true,
        border: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.15)',
        },
        ticks: {
          color: '#a1a1aa',
          callback: function(value) {
            if (activeDisplayMode === 'gamma') {
              return (Number(value) / 1000).toFixed(3);
            }
            
            // Abbreviate large numbers
            if (value >= 1000000) {
              return (Number(value) / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (Number(value) / 1000).toFixed(1) + 'K';
            }
            return value;
          },
        },
        title: {
          display: true,
          text: getDisplayTitle(),
          color: '#a1a1aa',
          font: {
            size: 12,
          },
        },
        beginAtZero: true,
      },
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
          callback: function(value) {
            const index = Number(value);
            if (index >= 0 && index < data.length) {
              // Show more ticks on smaller datasets, fewer on larger ones
              const interval = data.length > 20 ? 4 : 2;
              if (index % interval === 0) {
                return `$${data[index].strike}`;
              }
            }
            return '';
          },
        },
        title: {
          display: true,
          text: "Strike Price",
          color: '#a1a1aa',
          font: {
            size: 12,
          },
        },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0 && onStrikeClick) {
        const index = parseInt(elements[0].index.toString());
        setHighlightedIndex(index);
        onStrikeClick(data[index]);
      }
    },
    onHover: (_, elements) => {
      if (elements.length > 0) {
        const index = parseInt(elements[0].index.toString());
        setHighlightedIndex(index);
      } else {
        setHighlightedIndex(null);
      }
    },
  };

  const chartData: ChartData<"bar"> = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        label: "Calls",
        data: data.map((strike) => getDataByMode(strike).call),
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.6)';
          return getGradient(ctx, chartArea, 'rgba(16, 185, 129, 0.9)', 'rgba(16, 185, 129, 0.4)');
        },
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(16, 185, 129, 0.8)",
        hoverBorderColor: "rgba(16, 185, 129, 1)",
        hoverBorderWidth: 2,
      },
      {
        label: "Puts",
        data: data.map((strike) => getDataByMode(strike).put),
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(239, 68, 68, 0.6)';
          return getGradient(ctx, chartArea, 'rgba(239, 68, 68, 0.9)', 'rgba(239, 68, 68, 0.4)');
        },
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(239, 68, 68, 0.8)",
        hoverBorderColor: "rgba(239, 68, 68, 1)",
        hoverBorderWidth: 2,
      },
    ],
  };

  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {activeDisplayMode === 'openInterest' ? 'OI distribution across strikes' : 
             activeDisplayMode === 'volume' ? 'Trading volume across strikes' : 
             'Gamma exposure across strikes'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowNotableStrikes(!showNotableStrikes)}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
                    showNotableStrikes 
                      ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700" 
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  )}
                >
                  <Target size={16} className="mr-1" />
                  Notables
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle notable strike levels</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          
          <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveDisplayMode('openInterest')}
              className={cn(
                "inline-flex h-8 items-center justify-center px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                activeDisplayMode === 'openInterest'
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              OI
            </button>
            <button
              onClick={() => setActiveDisplayMode('volume')}
              className={cn(
                "inline-flex h-8 items-center justify-center px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                activeDisplayMode === 'volume'
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              Volume
            </button>
            <button
              onClick={() => setActiveDisplayMode('gamma')}
              className={cn(
                "inline-flex h-8 items-center justify-center px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
                activeDisplayMode === 'gamma'
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              Gamma
            </button>
          </div>
          
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50">
                  <Info size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="w-80">
                <div className="text-sm">
                  <p className="font-medium">Options Chain Legend</p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center">
                      <span className="h-2 w-6 rounded-sm bg-blue-500 mr-2"></span>
                      <span>Current Price: ${currentPrice.toFixed(2)}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-6 rounded-sm bg-purple-500 mr-2"></span>
                      <span>Max Pain: ${maxPain.toFixed(2)}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-6 rounded-sm bg-green-500 mr-2"></span>
                      <span>Call Data</span>
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-6 rounded-sm bg-red-500 mr-2"></span>
                      <span>Put Data</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Click on any bar to select that strike price for detailed analysis</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Key metrics display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Current Price</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">${currentPrice.toFixed(2)}</div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Max Pain</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">${maxPain.toFixed(2)}</div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">PCR (OI)</div>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {(data.reduce((sum, strike) => sum + strike.put.oi, 0) / 
                data.reduce((sum, strike) => sum + strike.call.oi, 0)).toFixed(2)}
            </span>
            {(data.reduce((sum, strike) => sum + strike.put.oi, 0) / 
              data.reduce((sum, strike) => sum + strike.call.oi, 0)) < 0.8 ? (
              <ArrowDown className="ml-1 h-4 w-4 text-green-500" />
            ) : (data.reduce((sum, strike) => sum + strike.put.oi, 0) / 
              data.reduce((sum, strike) => sum + strike.call.oi, 0)) > 1.2 ? (
              <ArrowUp className="ml-1 h-4 w-4 text-red-500" />
            ) : (
              <span className="ml-1 h-4 w-4 text-blue-500">—</span>
            )}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Net Gamma</div>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {(data.reduce((sum, strike) => sum + strike.call.gamma - strike.put.gamma, 0)).toFixed(3)}
            </span>
            {(data.reduce((sum, strike) => sum + strike.call.gamma - strike.put.gamma, 0)) > 0 ? (
              <ArrowUp className="ml-1 h-4 w-4 text-green-500" />
            ) : (data.reduce((sum, strike) => sum + strike.call.gamma - strike.put.gamma, 0)) < 0 ? (
              <ArrowDown className="ml-1 h-4 w-4 text-red-500" />
            ) : (
              <span className="ml-1 h-4 w-4 text-blue-500">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/80 dark:bg-zinc-900/80 z-10 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center">
              <RefreshCw size={24} className="animate-spin text-zinc-500 dark:text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading options data...</p>
            </div>
          </div>
        ) : null}
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeDisplayMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Bar
              ref={chartRef}
              options={options}
              data={chartData}
              plugins={[verticalLinePlugin]}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {highlightedIndex !== null && (
        <div className="mt-4 p-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Strike: ${data[highlightedIndex].strike.toFixed(2)}
            </h4>
            <Badge variant={data[highlightedIndex].strike <= currentPrice ? "outline" : "secondary"}>
              {data[highlightedIndex].strike <= currentPrice ? "ITM" : "OTM"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Call Data</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li className="flex justify-between">
                  <span>OI:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].call.oi.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].call.volume.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>IV:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].call.iv.toFixed(2)}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Gamma:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].call.gamma.toFixed(4)}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Put Data</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li className="flex justify-between">
                  <span>OI:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].put.oi.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].put.volume.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>IV:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].put.iv.toFixed(2)}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Gamma:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {data[highlightedIndex].put.gamma.toFixed(4)}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}