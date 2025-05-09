"use client";

import { useEffect, useRef } from "react";
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
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

interface ChartJSOptionsChainProps {
  data: Strike[];
  currentPrice: number;
  maxPain: number;
  height?: number;
  title?: string;
  showVolume?: boolean;
}

export default function ChartJSOptionsChain({
  data,
  currentPrice,
  maxPain,
  height = 300,
  title = "Options Open Interest",
  showVolume = false,
}: ChartJSOptionsChainProps) {
  // Create a plugin for drawing vertical lines for current price and max pain
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart: any) => {
      if (chart.tooltip?._active?.length) {
        return;
      }
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      // Current price line
      const currentPriceIndex = data.findIndex(d => d.strike >= currentPrice);
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
      ctx.strokeStyle = 'rgba(54, 162, 235, 0.8)';
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
      
      // Max pain line
      const maxPainIndex = data.findIndex(d => d.strike >= maxPain);
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
      ctx.strokeStyle = 'rgba(153, 102, 255, 0.8)';
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.restore();
      
      // Labels
      ctx.save();
      ctx.fillStyle = 'rgba(54, 162, 235, 1)';
      ctx.fillText('Current Price', currentPriceX + 5, yAxis.top + 15);
      ctx.fillStyle = 'rgba(153, 102, 255, 1)';
      ctx.fillText('Max Pain', maxPainX + 5, yAxis.top + 30);
      ctx.restore();
    }
  };

  // Register the plugin
  ChartJS.register(verticalLinePlugin);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const index = parseInt(items[0].label);
            return `Strike: $${data[index].strike}`;
          },
        },
      },
    },
    scales: {
      y: {
        display: true,
        title: {
          display: true,
          text: showVolume ? "Volume" : "Open Interest",
        },
        beginAtZero: true,
      },
      x: {
        display: true,
        title: {
          display: true,
          text: "Strike Price",
        },
        ticks: {
          callback: function(value) {
            const index = Number(value);
            if (index >= 0 && index < data.length && index % 2 === 0) {
              return `$${data[index].strike}`;
            }
            return '';
          },
        },
      },
    },
  };

  const chartData: ChartData<"bar"> = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        label: "Call " + (showVolume ? "Volume" : "OI"),
        data: data.map((strike) => showVolume ? strike.call.volume : strike.call.oi),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Put " + (showVolume ? "Volume" : "OI"),
        data: data.map((strike) => showVolume ? strike.put.volume : strike.put.oi),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
