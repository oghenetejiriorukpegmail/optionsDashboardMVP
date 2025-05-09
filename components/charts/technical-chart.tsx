"use client";

import React, { useEffect, useRef } from "react";

interface DataPoint {
  date: string;
  close: number;
  ema10: number;
  ema20: number;
  ema50: number;
  volume: number;
  rsi: number;
}

interface TechnicalChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  showRSI?: boolean;
}

const TechnicalChart: React.FC<TechnicalChartProps> = ({
  data,
  width = 800,
  height = 400,
  showVolume = true,
  showRSI = false,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // This is a placeholder for real chart implementation
    // In a production app, you would use a library like Chart.js or d3.js
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Set background
    ctx.fillStyle = "#f8fafc"; // light background
    ctx.fillRect(0, 0, width, height);

    // Draw a simple line for demonstration (this is just a placeholder)
    ctx.beginPath();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;

    // Calculate max and min for scaling
    const priceValues = data.map(point => point.close);
    const maxPrice = Math.max(...priceValues) * 1.05; // Add 5% padding
    const minPrice = Math.min(...priceValues) * 0.95; // Subtract 5% padding
    const priceRange = maxPrice - minPrice;

    // Draw price line
    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((point.close - minPrice) / priceRange) * height * 0.7;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw EMA lines
    const drawEMALine = (emaKey: 'ema10' | 'ema20' | 'ema50', color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      data.forEach((point, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((point[emaKey] - minPrice) / priceRange) * height * 0.7;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    drawEMALine('ema10', '#ef4444'); // red for 10 EMA
    drawEMALine('ema20', '#3b82f6'); // blue for 20 EMA
    drawEMALine('ema50', '#10b981'); // green for 50 EMA

    // Add legend
    ctx.font = "12px Arial";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Price", 10, 20);
    
    ctx.fillStyle = "#ef4444";
    ctx.fillText("10 EMA", 10, 40);
    
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("20 EMA", 10, 60);
    
    ctx.fillStyle = "#10b981";
    ctx.fillText("50 EMA", 10, 80);

    // Note: In a real implementation, you would also draw:
    // - Volume bars at the bottom
    // - RSI in a separate panel if showRSI is true
    // - Proper scales, grid lines, tooltips, etc.
    
  }, [data, width, height, showVolume, showRSI]);

  return (
    <div className="relative">
      <canvas 
        ref={chartRef} 
        width={width} 
        height={height}
        className="w-full h-auto rounded-md"
      />
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Note: This is a placeholder chart. In production, use Chart.js or another charting library for advanced visualizations.
      </div>
    </div>
  );
};

export default TechnicalChart;
