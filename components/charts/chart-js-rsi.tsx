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
  rsi: number;
  stochasticRsi?: number;
}

interface ChartJSRSIProps {
  data: DataPoint[];
  height?: number;
  title?: string;
}

export default function ChartJSRSI({
  data,
  height = 200,
  title = "RSI Chart",
}: ChartJSRSIProps) {
  const options: ChartOptions<"line"> = {
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
    },
    scales: {
      y: {
        display: true,
        title: {
          display: true,
          text: "RSI",
        },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
        },
      },
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
    },
  };

  const chartData: ChartData<"line"> = {
    labels: data.map((point) => point.date),
    datasets: [
      {
        label: "RSI",
        data: data.map((point) => point.rsi),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
      {
        label: "Overbought (70)",
        data: Array(data.length).fill(70),
        borderColor: "rgba(255, 99, 132, 0.7)",
        backgroundColor: "rgba(255, 99, 132, 0)",
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: "Oversold (30)",
        data: Array(data.length).fill(30),
        borderColor: "rgba(54, 162, 235, 0.7)",
        backgroundColor: "rgba(54, 162, 235, 0)",
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  // Add Stochastic RSI if available
  if (data[0].stochasticRsi !== undefined) {
    chartData.datasets.push({
      label: "Stochastic RSI",
      data: data.map((point) => point.stochasticRsi || 0),
      borderColor: "rgb(255, 159, 64)",
      backgroundColor: "rgba(255, 159, 64, 0.5)",
      borderDash: [3, 3],
      tension: 0.1,
    });
  }

  return (
    <div style={{ height }}>
      <Line options={options} data={chartData} />
    </div>
  );
}
