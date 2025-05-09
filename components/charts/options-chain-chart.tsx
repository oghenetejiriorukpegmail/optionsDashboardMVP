"use client";

import React, { useEffect, useRef } from "react";

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

interface OptionsChainChartProps {
  data: Strike[];
  currentPrice: number;
  maxPain: number;
  width?: number;
  height?: number;
  showGamma?: boolean;
  showVolume?: boolean;
}

const OptionsChainChart: React.FC<OptionsChainChartProps> = ({
  data,
  currentPrice,
  maxPain,
  width = 800,
  height = 400,
  showGamma = false,
  showVolume = false,
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

    // Determine the maximum OI value for scaling
    const maxCallOI = Math.max(...data.map(strike => strike.call.oi));
    const maxPutOI = Math.max(...data.map(strike => strike.put.oi));
    const maxOI = Math.max(maxCallOI, maxPutOI);
    
    // Calculate chart dimensions and spacing
    const chartPadding = 40;
    const chartWidth = width - chartPadding * 2;
    const chartHeight = height - chartPadding * 2;
    const barWidth = (chartWidth / data.length) * 0.4; // 40% of available space per strike
    const strikeSpacing = chartWidth / data.length;
    
    // Draw the strike price axis (x-axis)
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = 1;
    ctx.moveTo(chartPadding, height - chartPadding);
    ctx.lineTo(width - chartPadding, height - chartPadding);
    ctx.stroke();
    
    // Draw the OI axis (y-axis)
    ctx.beginPath();
    ctx.moveTo(chartPadding, chartPadding);
    ctx.lineTo(chartPadding, height - chartPadding);
    ctx.stroke();
    
    // Draw the call and put OI bars
    data.forEach((strike, i) => {
      const x = chartPadding + i * strikeSpacing + strikeSpacing / 2;
      
      // Draw call OI bar (upward)
      const callHeight = (strike.call.oi / maxOI) * (chartHeight / 2);
      ctx.fillStyle = "#22c55e"; // green-500
      ctx.fillRect(
        x - barWidth - 2, 
        height - chartPadding - callHeight, 
        barWidth, 
        callHeight
      );
      
      // Draw put OI bar (downward)
      const putHeight = (strike.put.oi / maxOI) * (chartHeight / 2);
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.fillRect(
        x + 2, 
        height - chartPadding - putHeight, 
        barWidth, 
        putHeight
      );
      
      // Label the strike price
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        strike.strike.toString(), 
        x, 
        height - chartPadding + 15
      );
    });
    
    // Draw current price line
    const currentPriceX = chartPadding + 
      ((currentPrice - data[0].strike) / (data[data.length - 1].strike - data[0].strike)) * chartWidth;
    
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(currentPriceX, chartPadding);
    ctx.lineTo(currentPriceX, height - chartPadding);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw Max Pain line
    const maxPainX = chartPadding + 
      ((maxPain - data[0].strike) / (data[data.length - 1].strike - data[0].strike)) * chartWidth;
    
    ctx.beginPath();
    ctx.strokeStyle = "#8b5cf6"; // violet-500
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.moveTo(maxPainX, chartPadding);
    ctx.lineTo(maxPainX, height - chartPadding);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add legend
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    
    // Call OI legend
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(chartPadding, 20, 15, 10);
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Call OI", chartPadding + 20, 28);
    
    // Put OI legend
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(chartPadding + 100, 20, 15, 10);
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Put OI", chartPadding + 120, 28);
    
    // Current price legend
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(chartPadding + 200, 25);
    ctx.lineTo(chartPadding + 230, 25);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("Current Price", chartPadding + 235, 28);
    
    // Max Pain legend
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(chartPadding + 350, 25);
    ctx.lineTo(chartPadding + 380, 25);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("Max Pain", chartPadding + 385, 28);
    
    // Note: In a real implementation, you would also:
    // - Add proper scales with tick marks
    // - Draw gamma values if showGamma is true
    // - Draw volume bars if showVolume is true
    // - Add tooltips for interactive exploration
    // - Handle window resizing
    
  }, [data, currentPrice, maxPain, width, height, showGamma, showVolume]);

  return (
    <div className="relative">
      <canvas 
        ref={chartRef} 
        width={width} 
        height={height}
        className="w-full h-auto rounded-md"
      />
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Note: This chart shows call and put open interest across strikes. Current price and Max Pain are indicated by blue and purple lines respectively.
      </div>
    </div>
  );
};

export default OptionsChainChart;
