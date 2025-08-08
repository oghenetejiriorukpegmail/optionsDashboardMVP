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
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

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
  ema10: number;
  ema20: number;
  ema50: number;
  volume: number;
  rsi: number;
}

interface ChartJSTechnicalProps {
  data: DataPoint[];
  height?: number;
  title?: string;
}

export default function ChartJSTechnical({
  data,
  height = 300,
  title = "Price & EMA Chart",
}: ChartJSTechnicalProps) {
  // Read CSS variable when available (falls back to provided color string)
  const getCssVar = (name: string, fallback: string) => {
    if (typeof document === "undefined") return fallback;
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val ? val.trim() : fallback;
  };

  const tooltipBg = getCssVar("--card", "rgb(15,23,42)");
  const tooltipFg = getCssVar("--card-foreground", "rgb(255,255,255)");
  const accentColor = getCssVar("--accent", "rgb(6,182,212)");

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          usePointStyle: true,
          padding: 12,
          boxWidth: 8,
        },
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        enabled: true,
        backgroundColor: tooltipBg,
        titleColor: tooltipFg,
        bodyColor: tooltipFg,
        borderColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.formattedValue;
            return `${context.dataset.label ?? ""}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        display: true,
        title: {
          display: true,
          text: "Price",
        },
        ticks: {
          callback: function (val) {
            // @ts-ignore
            const num = Number(this.getLabelForValue(val));
            if (isNaN(num)) return String(val);
            return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
          },
        },
      },
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 5,
      },
      line: {
        tension: 0.12,
      },
    },
    hover: {
      mode: "nearest",
      intersect: false,
    },
  };

  const chartData: ChartData<"line"> = {
    labels: data.map((point) => point.date),
    datasets: [
      {
        label: "Price",
        data: data.map((point) => point.close),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.1,
      },
      {
        label: "EMA 10",
        data: data.map((point) => point.ema10),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderWidth: 1.5,
        tension: 0.1,
      },
      {
        label: "EMA 20",
        data: data.map((point) => point.ema20),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderWidth: 1.5,
        tension: 0.1,
      },
      {
        label: "EMA 50",
        data: data.map((point) => point.ema50),
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.5)",
        borderWidth: 1.5,
        tension: 0.1,
      },
    ],
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-md">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-md bg-[color:var(--card)/0.6]" />
          <p className="text-sm text-[color:var(--muted-foreground)]">No data available for chart</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line options={options} data={chartData} />
    </div>
  );
}
