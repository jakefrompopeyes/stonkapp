'use client';

import React, { useState, useEffect } from 'react';
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
import { PriceData, getStockPrices } from '@/lib/stockApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type TimePeriod = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | '5Y';

interface StockPriceChartProps {
  ticker: string;
}

// Helper function to generate mock data points between two existing points
const generateIntermediatePoints = (start: PriceData, end: PriceData, count: number): PriceData[] => {
  const result: PriceData[] = [];
  
  // Convert string timestamps to numbers if needed
  const startTimestamp = typeof start.t === 'string' ? new Date(start.t).getTime() : start.t;
  const endTimestamp = typeof end.t === 'string' ? new Date(end.t).getTime() : end.t;
  
  const timeStep = (endTimestamp - startTimestamp) / (count + 1);
  
  const startPrice = start.c;
  const endPrice = end.c;
  const priceStep = (endPrice - startPrice) / (count + 1);
  
  for (let i = 1; i <= count; i++) {
    const timestamp = startTimestamp + timeStep * i;
    const price = startPrice + priceStep * i;
    
    result.push({
      t: timestamp,
      o: price,
      h: price + (Math.random() * 0.5),
      l: price - (Math.random() * 0.5),
      c: price,
      v: Math.floor(Math.random() * 10000),
      n: 0,
      vw: price
    });
  }
  
  return result;
};

// Helper function to generate a smooth line with many points
const generateSmoothLine = (data: PriceData[], pointsPerSegment: number = 10): PriceData[] => {
  if (data.length < 2) return data;
  
  let result: PriceData[] = [data[0]];
  
  for (let i = 0; i < data.length - 1; i++) {
    const intermediatePoints = generateIntermediatePoints(
      data[i],
      data[i + 1],
      pointsPerSegment
    );
    
    result = [...result, ...intermediatePoints];
    
    if (i < data.length - 2) {
      result.push(data[i + 1]);
    }
  }
  
  result.push(data[data.length - 1]);
  
  return result;
};

const StockPriceChart: React.FC<StockPriceChartProps> = ({ ticker }) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const fetchPriceData = async () => {
      setLoading(true);
      setError(null);
      let debugText = '';
      
      try {
        // Calculate date range based on selected period
        const toDate = new Date();
        let fromDate = new Date();
        
        // Set timespan and multiplier based on selected period
        let timespan = 'day';
        let multiplier = 1;
        
        // Extend the date range to get more data points
        switch (selectedPeriod) {
          case '1D':
            // For 1D, use minute data with 5-minute intervals
            timespan = 'minute';
            multiplier = 5;
            fromDate.setDate(toDate.getDate() - 1);
            break;
          case '1W':
            // For 1W, use hourly data
            timespan = 'hour';
            multiplier = 1;
            fromDate.setDate(toDate.getDate() - 7);
            break;
          case '1M':
            // For 1M, use daily data
            timespan = 'day';
            multiplier = 1;
            fromDate.setMonth(toDate.getMonth() - 1);
            break;
          case '3M':
            // For 3M, use daily data
            timespan = 'day';
            multiplier = 1;
            fromDate.setMonth(toDate.getMonth() - 3);
            break;
          case 'YTD':
            // For YTD, use daily data
            timespan = 'day';
            multiplier = 1;
            fromDate = new Date(toDate.getFullYear(), 0, 1); // January 1st of current year
            break;
          case '1Y':
            // For 1Y, use daily data
            timespan = 'day';
            multiplier = 1;
            fromDate.setFullYear(toDate.getFullYear() - 1);
            break;
          case '5Y':
            // For 5Y, use weekly data
            timespan = 'week';
            multiplier = 1;
            fromDate.setFullYear(toDate.getFullYear() - 5);
            break;
        }
        
        const from = fromDate.toISOString().split('T')[0];
        const to = toDate.toISOString().split('T')[0];
        
        debugText += `Fetching data from ${from} to ${to} with timespan=${timespan}, multiplier=${multiplier}...\n`;
        
        const data = await getStockPrices(ticker, from, to, timespan, multiplier);
        
        debugText += `Received ${data.length} data points from API.\n`;
        
        // Sort data by date to ensure correct order
        const sortedData = [...data].sort((a, b) => 
          new Date(a.t).getTime() - new Date(b.t).getTime()
        );
        
        // For 1D and 1W, we should have enough data points now, so we can skip the filtering
        // For longer periods, we might still want to filter to show only relevant points
        let filteredData = sortedData;
        
        if (selectedPeriod === '1M' || selectedPeriod === '3M' || 
            selectedPeriod === 'YTD' || selectedPeriod === '1Y' || 
            selectedPeriod === '5Y') {
          // For longer periods, we might want to sample the data to avoid too many points
          // This is optional now that we have more granular data
          if (sortedData.length > 200) {
            const sampleRate = Math.ceil(sortedData.length / 200);
            filteredData = sortedData.filter((_, index) => index % sampleRate === 0);
            debugText += `Sampled data to ${filteredData.length} points (rate: ${sampleRate}).\n`;
          }
        }
        
        // Always include the most recent data point
        if (filteredData.length > 0 && sortedData.length > 0 && 
            filteredData[filteredData.length - 1].t !== sortedData[sortedData.length - 1].t) {
          filteredData.push(sortedData[sortedData.length - 1]);
          debugText += `Added most recent point.\n`;
        }
        
        // Ensure we have at least 2 data points
        if (filteredData.length < 2 && sortedData.length >= 2) {
          filteredData = [sortedData[0], sortedData[sortedData.length - 1]];
          debugText += `Using first and last points from all data.\n`;
        }
        
        // Generate a smooth line with many points only if we have few data points
        // If we have enough real data points, we don't need to generate intermediate points
        let finalData = filteredData;
        
        if (filteredData.length < 20) {
          const pointsPerSegment = 
            selectedPeriod === '1D' ? 5 :
            selectedPeriod === '1W' ? 4 :
            selectedPeriod === '1M' ? 3 :
            selectedPeriod === '3M' ? 2 :
            selectedPeriod === 'YTD' ? 2 :
            selectedPeriod === '1Y' ? 1 : 1;
          
          debugText += `Generating smooth line with ${pointsPerSegment} points per segment...\n`;
          
          finalData = generateSmoothLine(filteredData, pointsPerSegment);
          debugText += `After smoothing: ${finalData.length} data points.\n`;
        } else {
          debugText += `Using ${filteredData.length} real data points without smoothing.\n`;
        }
        
        // Log the first few and last few data points for debugging
        if (finalData.length > 0) {
          debugText += `\nFirst point: ${new Date(finalData[0].t).toISOString()} - $${finalData[0].c}\n`;
          if (finalData.length > 1) {
            debugText += `Last point: ${new Date(finalData[finalData.length-1].t).toISOString()} - $${finalData[finalData.length-1].c}\n`;
          }
          if (finalData.length > 3) {
            debugText += `Sample middle point: ${new Date(finalData[Math.floor(finalData.length/2)].t).toISOString()} - $${finalData[Math.floor(finalData.length/2)].c}\n`;
          }
        }
        
        setPriceData(finalData);
        setDebugInfo(debugText);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
        setDebugInfo(debugText + `\nERROR: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPriceData();
  }, [ticker, selectedPeriod]);

  // Format data for Chart.js
  const chartData = {
    labels: priceData.map(item => {
      // Convert timestamp to Date object
      const date = typeof item.t === 'string' ? new Date(item.t) : new Date(item.t);
      
      // Format date based on selected period
      if (selectedPeriod === '1D') {
        // For 1D, show hours and minutes
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (selectedPeriod === '1W') {
        // For 1W, show day of week and date
        return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
      } else if (selectedPeriod === '1M') {
        // For 1M, show month and day
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        // For longer periods, show month and year
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }
    }),
    datasets: [
      {
        label: ticker,
        data: priceData.map(item => item.c), // Close price
        borderColor: '#22c55e', // Green color
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3, // Increased curve for the line
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af', // Gray-400
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: selectedPeriod === '1D' ? 6 : 8,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(75, 85, 99, 0.1)', // Gray-600 with opacity
          display: true,
        },
        ticks: {
          color: '#9ca3af', // Gray-400
          callback: function(value) {
            // Format the price with 2 decimal places
            return '$' + Number(value).toFixed(2);
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)', // Gray-900 with opacity
        titleColor: '#f9fafb', // Gray-50
        bodyColor: '#f9fafb', // Gray-50
        borderColor: '#4b5563', // Gray-600
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            const item = priceData[tooltipItems[0].dataIndex];
            const date = typeof item.t === 'string' ? new Date(item.t) : new Date(item.t);
            
            if (selectedPeriod === '1D') {
              return date.toLocaleTimeString([], { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              });
            } else if (selectedPeriod === '1W' || selectedPeriod === '1M') {
              return date.toLocaleDateString([], { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              });
            } else {
              return date.toLocaleDateString([], { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              });
            }
          },
          label: function(context) {
            return `$${Number(context.parsed.y).toFixed(2)}`;
          },
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.3, // Increased curve for smoother line
      },
      point: {
        radius: 0, // Hide points
        hoverRadius: 5, // Show points on hover
      },
    },
  };

  const periods: TimePeriod[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'];

  return (
    <div className="bg-black p-4 rounded-md">
      <div className="h-80 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : priceData.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">Insufficient price data available</p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
      
      <div className="flex justify-between items-center mt-4 border-t border-gray-800 pt-4">
        <div className="flex space-x-4">
          {periods.map((period) => (
            <button
              key={period}
              className={`px-2 py-1 text-sm rounded ${
                selectedPeriod === period
                  ? 'text-green-500 font-medium bg-green-500 bg-opacity-10'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
        
        <button 
          className="text-xs text-gray-500 hover:text-gray-300"
          onClick={() => alert(debugInfo)}
        >
          Debug ({priceData.length} points)
        </button>
      </div>
    </div>
  );
};

export default StockPriceChart; 