"use client";

import { useEffect, useRef, useState } from "react";
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
import { Line, Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Define the Strike interface for options chain data
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

interface CharmVannaChartProps {
  data: Strike[];
  currentPrice: number;
  height?: number;
  className?: string;
}

export default function CharmVannaChart({
  data,
  currentPrice,
  height = 250,
  className,
}: CharmVannaChartProps) {
  const [activeTab, setActiveTab] = useState<"charm" | "vanna">("charm");
  const chartRef = useRef<ChartJS<"line">>(null);

  // Create gradients for line charts
  const createGradient = (ctx: CanvasRenderingContext2D, color1: string, color2: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  };

  // Draw vertical line plugin for current price
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
        
        // Current price label
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        const textWidth = ctx.measureText(`$${currentPrice.toFixed(2)}`).width + 10;
        ctx.fillRect(currentPriceX - textWidth/2, yAxis.top - 25, textWidth, 20);
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
        ctx.textAlign = 'center';
        ctx.fillText(`$${currentPrice.toFixed(2)}`, currentPriceX, yAxis.top - 10);
        ctx.restore();
      }
    }
  };

  // Register plugin
  ChartJS.register(verticalLinePlugin);

  // Extract charm and vanna data from the dataset
  const callCharmData = data.map(strike => strike.call.charm);
  const putCharmData = data.map(strike => strike.put.charm);
  
  const callVannaData = data.map(strike => strike.call.vanna);
  const putVannaData = data.map(strike => strike.put.vanna);

  // Prepare chart data for Charm
  const charmChartData: ChartData<"line"> = {
    labels: data.map(strike => strike.strike.toString()),
    datasets: [
      {
        label: "Call Charm",
        data: callCharmData,
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, "rgba(16, 185, 129, 0.7)", "rgba(16, 185, 129, 0.1)");
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Put Charm",
        data: putCharmData,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, "rgba(239, 68, 68, 0.7)", "rgba(239, 68, 68, 0.1)");
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Prepare chart data for Vanna
  const vannaChartData: ChartData<"line"> = {
    labels: data.map(strike => strike.strike.toString()),
    datasets: [
      {
        label: "Call Vanna",
        data: callVannaData,
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, "rgba(16, 185, 129, 0.7)", "rgba(16, 185, 129, 0.1)");
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Put Vanna",
        data: putVannaData,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, "rgba(239, 68, 68, 0.7)", "rgba(239, 68, 68, 0.1)");
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Chart options
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10,
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
        cornerRadius: 6,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            return `Strike: $${items[0].label}`;
          },
          label: (context) => {
            const dataset = context.dataset.label || '';
            const value = context.parsed.y;
            
            return `${dataset}: ${value.toFixed(4)}`;
          },
          afterLabel: (context) => {
            const strike = parseFloat(context.label);
            const distanceFromPrice = ((strike - currentPrice) / currentPrice) * 100;
            
            // Add positive/negative indicator for charm and vanna
            const greekType = activeTab === "charm" ? "Charm" : "Vanna";
            const interpretation = context.parsed.y > 0 
              ? `Positive ${greekType}: ${activeTab === "charm" ? "Delta increases with time" : "Delta increases with IV"}`
              : `Negative ${greekType}: ${activeTab === "charm" ? "Delta decreases with time" : "Delta decreases with IV"}`;
            
            return [
              `${Math.abs(distanceFromPrice).toFixed(1)}% ${distanceFromPrice >= 0 ? 'OTM' : 'ITM'}`,
              interpretation
            ];
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
        },
        title: {
          display: true,
          text: activeTab === "charm" ? "Charm (Δ Decay)" : "Vanna (Δ-Volatility)",
          color: '#a1a1aa',
        },
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
          callback: function(value, index) {
            // Show fewer labels on the x-axis for readability
            const interval = data.length > 20 ? 5 : 2;
            if (index % interval === 0) {
              return `$${value}`;
            }
            return '';
          }
        },
        title: {
          display: true,
          text: "Strike Price",
          color: '#a1a1aa',
        },
      },
    },
  };

  return (
    <div className={cn("relative", className)}>
      <Tabs defaultValue="charm" className="w-full" onValueChange={(value) => setActiveTab(value as "charm" | "vanna")}>
        <div className="flex justify-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="charm">Charm (Δ Decay)</TabsTrigger>
            <TabsTrigger value="vanna">Vanna (Δ-Volatility)</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="charm" style={{ height }}>
          <Line 
            data={charmChartData}
            options={options}
            plugins={[verticalLinePlugin]}
          />
        </TabsContent>
        
        <TabsContent value="vanna" style={{ height }}>
          <Line 
            data={vannaChartData}
            options={options}
            plugins={[verticalLinePlugin]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}