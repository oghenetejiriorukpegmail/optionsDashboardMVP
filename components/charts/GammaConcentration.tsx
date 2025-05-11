"use client";

import { useEffect, useRef } from "react";
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
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";

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
  };
  put: {
    oi: number;
    volume: number;
    iv: number;
    gamma: number;
    charm: number;
    vanna: number;
  };
}

interface GammaConcentrationProps {
  data: Strike[];
  currentPrice: number;
  maxPain: number;
  height?: number;
  title?: string;
  className?: string;
}

export default function GammaConcentration({
  data,
  currentPrice,
  maxPain,
  height = 250,
  title = "Gamma Concentration",
  className,
}: GammaConcentrationProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  // Calculate derivative of gamma - shows where gamma is steepest (changing fastest)
  const calculateGammaDerivative = () => {
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const deltaGamma = 
        (data[i].call.gamma + data[i].put.gamma) - 
        (data[i-1].call.gamma + data[i-1].put.gamma);
      const deltaStrike = data[i].strike - data[i-1].strike;
      result.push(deltaGamma / deltaStrike);
    }
    // Add a zero at the start to match array lengths
    return [0, ...result];
  };

  // Create gradient for line
  const createGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.8)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0.1)");
    return gradient;
  };

  // Create gradient for secondary line
  const createSecondaryGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.7)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)");
    return gradient;
  };

  // Draw vertical line plugin
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
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.8)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();
        
        // Max pain label
        ctx.save();
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        const textWidth = ctx.measureText('Max Pain').width + 10;
        ctx.fillRect(maxPainX - textWidth/2, yAxis.top - 45, textWidth, 20);
        ctx.fillStyle = 'rgba(124, 58, 237, 1)';
        ctx.textAlign = 'center';
        ctx.fillText('Max Pain', maxPainX, yAxis.top - 30);
        ctx.restore();
      }
    }
  };

  // Register plugin
  ChartJS.register(verticalLinePlugin);

  // Calculate combined gamma (calls + puts)
  const combinedGamma = data.map(strike => strike.call.gamma + strike.put.gamma);
  const gammaDerivative = calculateGammaDerivative();

  // Scale the derivative to make it visible on the same chart
  const maxGamma = Math.max(...combinedGamma);
  const scaledDerivative = gammaDerivative.map(val => val * (maxGamma / Math.max(...gammaDerivative.map(Math.abs))));

  // Prepare chart data
  const chartData: ChartData<"line"> = {
    labels: data.map(strike => strike.strike.toString()),
    datasets: [
      {
        label: "Gamma",
        data: combinedGamma,
        borderColor: "rgba(124, 58, 237, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx);
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Gamma Rate of Change",
        data: scaledDerivative,
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx} = chart;
          return createSecondaryGradient(ctx);
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [5, 5],
        fill: false,
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
    plugins: {
      legend: {
        position: "top",
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
            
            if (dataset === "Gamma") {
              return `${dataset}: ${value.toFixed(4)}`;
            } else {
              return `${dataset}: ${value.toFixed(4)}`;
            }
          },
          afterLabel: (context) => {
            const strike = parseFloat(context.label);
            const distanceFromPrice = ((strike - currentPrice) / currentPrice) * 100;
            
            return `${Math.abs(distanceFromPrice).toFixed(1)}% ${distanceFromPrice >= 0 ? 'OTM' : 'ITM'}`;
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
          text: "Gamma",
          color: '#a1a1aa',
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
    <div className={cn("relative", className)} style={{ height }}>
      <Line 
        ref={chartRef}
        data={chartData}
        options={options}
        plugins={[verticalLinePlugin]}
      />
    </div>
  );
}