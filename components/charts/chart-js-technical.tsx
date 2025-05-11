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
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
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
          text: "Price",
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

  return (
    <div style={{ height }}>
      <Line options={options} data={chartData} />
    </div>
  );
}
