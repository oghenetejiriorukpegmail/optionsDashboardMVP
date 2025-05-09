"use client";

import React, { useEffect, useRef } from "react";

interface DataPoint {
  date: string;
  rsi: number;
  stochasticRsi?: number;
}

interface RSIChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showStochasticRSI?: boolean;
}

const RSIChart: React.FC<RSIChartProps> = ({
  data,
  width = 800,
  height = 200,
  showStochasticRSI = true,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Get the canvas context
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = "#f8fafc"; // light background
    ctx.fillRect(0, 0, width, height);

    // Calculate chart dimensions and spacing
    const chartPadding = { top: 30, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Draw chart background with zones
    const drawRSIBackground = () => {
      // Overbought zone (70-100)
      ctx.fillStyle = "rgba(239, 68, 68, 0.1)"; // red-500 with 10% opacity
      const overboughtHeight = chartHeight * 0.3; // 30% of chart height
      ctx.fillRect(
        chartPadding.left, 
        chartPadding.top, 
        chartWidth, 
        overboughtHeight
      );
      
      // Neutral zone (30-70)
      ctx.fillStyle = "rgba(59, 130, 246, 0.05)"; // blue-500 with 5% opacity
      const neutralHeight = chartHeight * 0.4; // 40% of chart height
      ctx.fillRect(
        chartPadding.left, 
        chartPadding.top + overboughtHeight, 
        chartWidth, 
        neutralHeight
      );
      
      // Oversold zone (0-30)
      ctx.fillStyle = "rgba(34, 197, 94, 0.1)"; // green-500 with 10% opacity
      const oversoldHeight = chartHeight * 0.3; // 30% of chart height
      ctx.fillRect(
        chartPadding.left, 
        chartPadding.top + overboughtHeight + neutralHeight, 
        chartWidth, 
        oversoldHeight
      );
    };
    
    drawRSIBackground();
    
    // Draw x and y axes
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(chartPadding.left, height - chartPadding.bottom);
    ctx.lineTo(width - chartPadding.right, height - chartPadding.bottom);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartPadding.left, chartPadding.top);
    ctx.lineTo(chartPadding.left, height - chartPadding.bottom);
    ctx.stroke();
    
    // Draw horizontal grid lines and labels for RSI levels
    const rsiLevels = [0, 30, 50, 70, 100];
    rsiLevels.forEach(level => {
      const y = chartPadding.top + (1 - level / 100) * chartHeight;
      
      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.moveTo(chartPadding.left, y);
      ctx.lineTo(width - chartPadding.right, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = "#64748b"; // slate-500
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(level.toString(), chartPadding.left - 5, y);
    });
    
    // Draw RSI line
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    
    data.forEach((point, i) => {
      const x = chartPadding.left + (i / (data.length - 1)) * chartWidth;
      const y = chartPadding.top + (1 - point.rsi / 100) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw Stochastic RSI line if requested
    if (showStochasticRSI && data[0].stochasticRsi !== undefined) {
      ctx.beginPath();
      ctx.strokeStyle = "#f59e0b"; // amber-500
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      
      data.forEach((point, i) => {
        if (point.stochasticRsi === undefined) return;
        
        const x = chartPadding.left + (i / (data.length - 1)) * chartWidth;
        const y = chartPadding.top + (1 - point.stochasticRsi / 100) * chartHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Add legend
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    // RSI legend
    ctx.fillStyle = "#3b82f6"; // blue-500
    ctx.fillRect(chartPadding.left, 10, 15, 2);
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.fillText("RSI", chartPadding.left + 20, 5);
    
    // Stochastic RSI legend if shown
    if (showStochasticRSI) {
      ctx.strokeStyle = "#f59e0b"; // amber-500
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartPadding.left + 100, 11);
      ctx.lineTo(chartPadding.left + 115, 11);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillText("Stochastic RSI", chartPadding.left + 120, 5);
    }
    
    // Add labels for zones
    ctx.textAlign = "right";
    ctx.fillStyle = "#ef4444"; // red-500
    ctx.fillText("Overbought", width - chartPadding.right, chartPadding.top + 10);
    
    ctx.fillStyle = "#22c55e"; // green-500
    ctx.fillText("Oversold", width - chartPadding.right, height - chartPadding.bottom - 10);
    
  }, [data, width, height, showStochasticRSI]);

  return (
    <div className="relative">
      <canvas 
        ref={chartRef} 
        width={width} 
        height={height}
        className="w-full h-auto rounded-md"
      />
      <div className="text-xs text-muted-foreground mt-2 text-center">
        RSI Chart showing overbought (>70) and oversold (<30) zones
      </div>
    </div>
  );
};

export default RSIChart;
