"use client";

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CandlestickChartProps {
  data: any[];
  symbol: string;
  selectedPeriod?: string;
  height?: number;
}

export function CandlestickChart({ 
  data, 
  symbol, 
  selectedPeriod = '3M',
  height = 400 
}: CandlestickChartProps) {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  // Convert data to ApexCharts format
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // For candlestick: [timestamp, open, high, low, close]
    // For line: [timestamp, close]
    return data.map((item: any) => {
      const timestamp = new Date(item.date).getTime();
      
      if (chartType === 'candlestick') {
        return {
          x: timestamp,
          y: [
            item?.open || item?.close || 0,
            item?.high || item?.close || 0,
            item?.low || item?.close || 0,
            item?.close || 0
          ]
        };
      } else {
        return {
          x: timestamp,
          y: item?.close || 0
        };
      }
    }).filter((item: any) => item.y && (Array.isArray(item.y) ? item.y[3] > 0 : item.y > 0));
  }, [data, chartType]);

  // EMA data for overlays
  const emaData = useMemo(() => {
    if (!data || data.length === 0) return { ema10: [], ema20: [], ema50: [] };

    const ema10 = data.map((item: any) => ({
      x: new Date(item.date).getTime(),
      y: item?.ema10 || null
    })).filter((item: any) => item.y !== null);

    const ema20 = data.map((item: any) => ({
      x: new Date(item.date).getTime(),
      y: item?.ema20 || null
    })).filter((item: any) => item.y !== null);

    const ema50 = data.map((item: any) => ({
      x: new Date(item.date).getTime(),
      y: item?.ema50 || null
    })).filter((item: any) => item.y !== null);

    return { ema10, ema20, ema50 };
  }, [data]);

  const options: ApexOptions = {
    chart: {
      type: chartType,
      height: height,
      background: 'transparent',
      toolbar: {
        show: true,
        offsetX: 0,
        offsetY: 0,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    title: {
      text: `${symbol} ${chartType === 'candlestick' ? 'Candlestick' : 'Price'} Chart`,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151'
      }
    },
    series: [
      {
        name: `${symbol} ${chartType === 'candlestick' ? 'OHLC' : 'Price'}`,
        type: chartType,
        data: chartData
      },
      // Add EMA overlays only if we have data
      ...(emaData.ema10.length > 0 ? [{
        name: 'EMA 10',
        type: 'line' as const,
        data: emaData.ema10
      }] : []),
      ...(emaData.ema20.length > 0 ? [{
        name: 'EMA 20',
        type: 'line' as const,
        data: emaData.ema20
      }] : []),
      ...(emaData.ema50.length > 0 ? [{
        name: 'EMA 50',
        type: 'line' as const,
        data: emaData.ema50
      }] : [])
    ],
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        format: 'MMM dd',
        style: {
          colors: '#9CA3AF',
          fontSize: '11px'
        },
        offsetY: 5
      },
      axisBorder: {
        show: true,
        color: '#E5E7EB',
        height: 1
      },
      axisTicks: {
        show: true,
        color: '#E5E7EB',
        height: 5
      }
    },
    yaxis: {
      show: true,
      tooltip: {
        enabled: true
      },
      labels: {
        show: true,
        formatter: (value: number) => `$${value.toFixed(2)}`,
        style: {
          colors: '#9CA3AF',
          fontSize: '11px'
        }
      },
      opposite: true,
      forceNiceScale: true,
      min: undefined, // Let ApexCharts calculate automatically
      max: undefined, // Let ApexCharts calculate automatically
      tickAmount: 8
    },
    grid: {
      show: true,
      borderColor: 'rgba(156, 163, 175, 0.1)',
      strokeDashArray: 1,
      position: 'back',
      padding: {
        top: 10,
        right: 10,
        bottom: 20,
        left: 10
      },
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#22c55e',
          downward: '#ef4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    colors: ['#06b6d4', '#ef4444', '#f97316', '#8b5cf6'], // Cyan for main, red EMA10, orange EMA20, purple EMA50
    stroke: {
      curve: 'smooth',
      width: [1, 2, 2, 2] // Different widths for candlestick vs lines
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px'
      },
      shared: true,
      intersect: false,
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const series = w.globals.initialSeries[seriesIndex];
        const data = series.data[dataPointIndex];
        
        if (!data) return null;
        
        const date = new Date(data.x).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit'
        });
        
        // Get all series data for this timestamp
        const allSeries = w.globals.initialSeries;
        let tooltipContent = `<div class="px-3 py-2"><div class="font-semibold mb-2">${date}</div>`;
        
        // Main price data (candlestick or line)
        if (seriesIndex === 0 || chartType === 'candlestick') {
          if (chartType === 'candlestick' && Array.isArray(data.y)) {
            tooltipContent += `
              <div class="space-y-0.5 text-sm mb-2">
                <div class="text-cyan-300 font-semibold">OHLC Data:</div>
                <div>Open: <span class="font-mono text-white">$${data.y[0].toFixed(2)}</span></div>
                <div>High: <span class="font-mono text-white">$${data.y[1].toFixed(2)}</span></div>
                <div>Low: <span class="font-mono text-white">$${data.y[2].toFixed(2)}</span></div>
                <div>Close: <span class="font-mono text-white">$${data.y[3].toFixed(2)}</span></div>
              </div>
            `;
          } else {
            tooltipContent += `
              <div class="space-y-0.5 text-sm mb-2">
                <div>Price: <span class="font-mono text-white">$${(Array.isArray(data.y) ? data.y[3] : data.y).toFixed(2)}</span></div>
              </div>
            `;
          }
        }
        
        // Add EMA values for this timestamp
        const targetTimestamp = data.x;
        tooltipContent += `<div class="space-y-0.5 text-sm"><div class="text-gray-300 font-semibold">EMAs:</div>`;
        
        allSeries.forEach((serie: any, index: number) => {
          if (serie.name.includes('EMA')) {
            const emaPoint = serie.data.find((point: any) => Math.abs(point.x - targetTimestamp) < 86400000); // Within 1 day
            if (emaPoint) {
              const color = serie.name === 'EMA 10' ? 'text-red-400' : 
                           serie.name === 'EMA 20' ? 'text-orange-400' : 'text-purple-400';
              tooltipContent += `<div class="${color}">${serie.name}: <span class="font-mono text-white">$${emaPoint.y.toFixed(2)}</span></div>`;
            }
          }
        });
        
        tooltipContent += `</div></div>`;
        return tooltipContent;
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      markers: {
        size: 6,
        strokeWidth: 0
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  return (
    <div className="w-full">
      {/* Chart Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button 
          className={`px-3 py-1 text-sm border rounded ${
            chartType === 'line' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 border-gray-300'
          }`}
          onClick={() => setChartType('line')}
        >
          Line
        </button>
        <button 
          className={`px-3 py-1 text-sm border rounded ${
            chartType === 'candlestick' ? 'bg-green-500 text-white border-green-500' : 'bg-gray-100 border-gray-300'
          }`}
          onClick={() => setChartType('candlestick')}
        >
          Candlestick
        </button>
      </div>

      {/* Chart */}
      <div className="w-full">
        <Chart
          options={options}
          series={options.series}
          type={chartType}
          height={height}
        />
      </div>
    </div>
  );
}