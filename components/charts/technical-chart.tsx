"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataPoint {
  date: string;
  close: number;
  ema10: number | null;
  ema20: number | null;
  ema50: number | null;
  volume: number;
  rsi: number | null;
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
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }

  // Prepare data for Chart.js
  const labels = data.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Price',
        data: data.map(point => point.close),
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
      },
      {
        label: '10 EMA',
        data: data.map(point => point.ema10),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.1,
        spanGaps: true,
      },
      {
        label: '20 EMA',
        data: data.map(point => point.ema20),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.1,
        spanGaps: true,
      },
      {
        label: '50 EMA',
        data: data.map(point => point.ema50),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.1,
        spanGaps: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${label}: N/A`;
            }
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price ($)',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return '$' + value.toFixed(2);
            }
            return value;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
  };

  return (
    <div className="relative" style={{ width: width || '100%', height: height }}>
      <Line data={chartData} options={options} />
      {showRSI && (
        <div className="mt-4 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            RSI indicator would be displayed here in a separate chart panel
          </p>
        </div>
      )}
      {showVolume && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Volume bars would be displayed here below the price chart
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicalChart;