'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plugin
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
  onPeriodChange?: (period: TimePeriod) => void;
  onPriceChange?: (change: { amount: number; percentage: number } | null) => void;
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

const StockPriceChart: React.FC<StockPriceChartProps> = ({ ticker, onPeriodChange, onPriceChange }) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [priceChange, setPriceChange] = useState<{ amount: number; percentage: number } | null>(null);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [hoverChange, setHoverChange] = useState<{ amount: number; percentage: number } | null>(null);
  
  // New state variables for drag selection
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
  const [selectionChange, setSelectionChange] = useState<{ 
    startPrice: number; 
    endPrice: number;
    amount: number; 
    percentage: number;
    startDate: string;
    endDate: string;
  } | null>(null);
  const chartRef = useRef<any>(null);

  // Notify parent component when period changes
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(selectedPeriod);
    }
  }, [selectedPeriod, onPeriodChange]);

  // Notify parent component when price change is calculated
  useEffect(() => {
    if (onPriceChange && priceChange) {
      onPriceChange(priceChange);
    }
  }, [priceChange, onPriceChange]);

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
            // For 1D, use minute data with 10-minute intervals (doubled from 5 minutes to reduce points by half)
            timespan = 'minute';
            multiplier = 10;
            fromDate.setDate(toDate.getDate() - 1);
            break;
          case '1W':
            // For 1W, use hourly data
            timespan = 'hour';
            multiplier = 1;
            fromDate.setDate(toDate.getDate() - 7);
            break;
          case '1M':
            // Try a different approach for 1M - use hourly data with a larger multiplier
            timespan = 'hour';
            multiplier = 4; // Every 4 hours = 6 data points per day = ~180 points per month
            // Set the date range correctly
            fromDate = new Date(toDate);
            fromDate.setMonth(fromDate.getMonth() - 1);
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
            // For 5Y, use monthly data instead of weekly to reduce data points
            timespan = 'month';
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
        
        // For 1D, 1W, and 1M we should have enough data points now, so we can skip the filtering
        // For longer periods, we might still want to filter to show only relevant points
        let filteredData = sortedData;
        
        if (selectedPeriod === '3M' || selectedPeriod === 'YTD' || 
            selectedPeriod === '1Y' || selectedPeriod === '5Y') {
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
        
        // Target number of data points for all charts
        const targetDataPoints = 110;
        
        // Process data based on the selected period
        if (selectedPeriod === '1D' || selectedPeriod === '1W' || selectedPeriod === '1M' || 
            selectedPeriod === '3M' || selectedPeriod === 'YTD' || selectedPeriod === '1Y' || selectedPeriod === '5Y') {
          
          debugText += `\nProcessing data for ${selectedPeriod} period.\n`;
          debugText += `Received ${filteredData.length} data points.\n`;
          
          if (filteredData.length > targetDataPoints) {
            // If we have more points than needed, sample down to target
            const sampleRate = Math.ceil(filteredData.length / targetDataPoints);
            const sampledData = filteredData.filter((_, index) => index % sampleRate === 0);
            
            // Always include the first and last points
            if (sampledData.length > 0 && filteredData.length > 0) {
              if (sampledData[0].t !== filteredData[0].t) {
                sampledData.unshift(filteredData[0]);
              }
              if (sampledData[sampledData.length - 1].t !== filteredData[filteredData.length - 1].t) {
                sampledData.push(filteredData[filteredData.length - 1]);
              }
            }
            
            finalData = sampledData;
            debugText += `Sampled data to ${finalData.length} points (rate: ${sampleRate}).\n`;
          } else if (filteredData.length < targetDataPoints && filteredData.length >= 2) {
            // If we have fewer points than needed, generate intermediate points
            // Calculate how many points to add between each real data point
            const totalGaps = filteredData.length - 1;
            const totalPointsToAdd = targetDataPoints - filteredData.length;
            const pointsPerGap = Math.floor(totalPointsToAdd / totalGaps);
            
            if (pointsPerGap > 0) {
              debugText += `Generating smooth line with ${pointsPerGap} points per segment...\n`;
              finalData = generateSmoothLine(filteredData, pointsPerGap);
              debugText += `After smoothing: ${finalData.length} data points.\n`;
            } else {
              finalData = filteredData;
              debugText += `Using ${filteredData.length} real data points without smoothing (not enough gaps to add points).\n`;
            }
          } else {
            finalData = filteredData;
            debugText += `Using ${filteredData.length} real data points without modification.\n`;
          }
        }
        
        // Calculate price change for the selected period
        if (finalData.length >= 2) {
          const firstPrice = finalData[0].c;
          const lastPrice = finalData[finalData.length - 1].c;
          const changeAmount = lastPrice - firstPrice;
          const changePercentage = (changeAmount / firstPrice) * 100;
          
          setPriceChange({
            amount: changeAmount,
            percentage: changePercentage
          });
          
          debugText += `Price change: ${changeAmount.toFixed(2)} (${changePercentage.toFixed(2)}%)\n`;
        } else {
          setPriceChange(null);
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
        setPriceChange(null);
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
        // For 1M, show month and day with more precision
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else if (selectedPeriod === '5Y') {
        // For 5Y, only show month and year to reduce label complexity
        return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      } else {
        // For other longer periods, show month and year
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }
    }),
    datasets: [
      {
        label: ticker,
        data: priceData.map(item => item.c), // Close price
        borderColor: '#3B82F6', // Blue color
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2, // Use consistent line width for all charts
        // Make points consistent across all charts - show only on hover
        pointRadius: 0,
        tension: 0.2, // Use consistent tension for all charts
        fill: false,
      },
    ],
  };

  // Log chart data for debugging
  useEffect(() => {
    // Only log in development and not on every render
    if (process.env.NODE_ENV === 'development' && chartData.labels.length > 0) {
      console.log('Chart data updated:', {
        labels: chartData.labels.length,
        dataPoints: chartData.datasets[0].data.length,
        ticker,
        selectedPeriod
      });
    }
  }, [ticker, selectedPeriod]); // Only depend on ticker and selectedPeriod, not chartData

  // Helper function to format date based on period
  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    
    if (selectedPeriod === '1D') {
      return date.toLocaleTimeString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Calculate selection metrics when drag indices change
  useEffect(() => {
    // Skip if we don't have valid indices or data
    if (dragStartIndex === null || dragEndIndex === null || priceData.length === 0) {
      if (selectionChange !== null) {
        setSelectionChange(null);
      }
      return;
    }
    
    // Store current values to check if we need to update
    const prevSelectionChange = selectionChange;
    
    // Ensure indices are within bounds
    const startIdx = Math.max(0, Math.min(dragStartIndex, priceData.length - 1));
    const endIdx = Math.max(0, Math.min(dragEndIndex, priceData.length - 1));
    
    // Get prices at the start and end points
    const startPrice = priceData[startIdx].c;
    const endPrice = priceData[endIdx].c;
    
    // Calculate change
    const amount = endPrice - startPrice;
    const percentage = (amount / startPrice) * 100;
    
    // Format dates
    const startDate = formatDate(priceData[startIdx].t);
    const endDate = formatDate(priceData[endIdx].t);
    
    // Only update state if values have actually changed
    if (!prevSelectionChange || 
        prevSelectionChange.startPrice !== startPrice ||
        prevSelectionChange.endPrice !== endPrice ||
        prevSelectionChange.startDate !== startDate ||
        prevSelectionChange.endDate !== endDate) {
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Selection change calculated:', {
          startIdx,
          endIdx,
          startPrice,
          endPrice,
          amount,
          percentage,
          startDate,
          endDate
        });
      }
      
      setSelectionChange({
        startPrice,
        endPrice,
        amount,
        percentage,
        startDate,
        endDate
      });
    }
  }, [dragStartIndex, dragEndIndex, priceData, formatDate, selectionChange]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Set to 0 for instant animations
    },
    // Use consistent hover behavior for all charts
    hover: {
      mode: 'index',
      intersect: false,
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af', // Gray-400
          maxRotation: 0,
          autoSkip: true,
          // Use consistent tick limits for all charts
          maxTicksLimit: 6,
        },
        display: true, // Ensure x-axis is displayed
      },
      y: {
        position: 'right',
        grid: {
          display: false, // Remove grid lines on y-axis
        },
        ticks: {
          color: '#9ca3af', // Gray-400
          callback: function(value) {
            // Format the price with 2 decimal places
            return '$' + Number(value).toFixed(2);
          },
        },
        display: true, // Ensure y-axis is displayed
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
        // Disable the tooltip box that follows the cursor
        enabled: false,
        // Use a more efficient tooltip callback for 5Y
        external: function(context) {
          // Instead of using callbacks that update state, use external to handle tooltip rendering
          // This prevents the infinite update loop
          const tooltipModel = context.tooltip;
          if (!tooltipModel || !tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) return;
          
          const dataIndex = tooltipModel.dataPoints[0].dataIndex;
          if (dataIndex === undefined || !priceData[dataIndex]) return;
          
          // Update hover values without triggering re-renders during chart interactions
          if (context.chart.canvas && !isDragging) {
            const item = priceData[dataIndex];
            const price = item.c;
            const date = typeof item.t === 'string' ? new Date(item.t) : new Date(item.t);
            
            // Format date based on period
            let formattedDate = '';
            if (selectedPeriod === '1D') {
              formattedDate = date.toLocaleTimeString([], { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              });
            } else {
              formattedDate = date.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            }
            
            // Use requestAnimationFrame to batch state updates outside the render cycle
            if (window.requestAnimationFrame) {
              window.requestAnimationFrame(() => {
                if (hoverPrice !== price) setHoverPrice(price);
                if (hoverDate !== formattedDate) setHoverDate(formattedDate);
                
                // Calculate change from start
                if (priceData.length > 0) {
                  const startPrice = priceData[0].c;
                  const changeAmount = price - startPrice;
                  const changePercentage = (changeAmount / startPrice) * 100;
                  
                  if (!hoverChange || 
                      Math.abs(hoverChange.amount - changeAmount) > 0.001 || 
                      Math.abs(hoverChange.percentage - changePercentage) > 0.001) {
                    setHoverChange({
                      amount: changeAmount,
                      percentage: changePercentage
                    });
                  }
                }
              });
            }
          }
        },
        callbacks: {
          // Keep these empty to prevent state updates during tooltip rendering
          title: function() { return ''; },
          label: function() { return ''; }
        },
      },
    },
    elements: {
      line: {
        tension: 0.2, // Consistent tension for all charts
      },
      point: {
        radius: 0, // Hide points on all charts for consistency
        hoverRadius: 4, // Show points on hover for all charts
        hitRadius: 10, // Consistent hit area for all charts
        // Remove transition for instant dot appearance
        hoverBackgroundColor: '#3B82F6',
        hoverBorderColor: '#3B82F6',
        hoverBorderWidth: 2,
      },
    },
    // Add this to disable animations for hover state changes
    transitions: {
      active: {
        animation: {
          duration: 0 // Instant transition when hovering
        }
      }
    },
    backgroundColor: 'white',
    onHover: (event, elements) => {
      // Skip hover processing if we're already dragging
      if (isDragging && elements && elements.length > 0) {
        // Update drag end position while dragging
        const currentIndex = elements[0].index;
        if (currentIndex !== undefined && dragEndIndex !== currentIndex) {
          setDragEndIndex(currentIndex);
        }
        return;
      }
      
      // Skip hover processing if there are no elements or we're not in a stable state
      if (!elements || elements.length === 0) return;
      
      // Use requestAnimationFrame to batch state updates outside the render cycle
      if (window.requestAnimationFrame) {
        // Throttle hover updates to prevent excessive state changes
        if (!chartRef.current._lastHoverTime || Date.now() - chartRef.current._lastHoverTime > 50) {
          window.requestAnimationFrame(() => {
            const hoverIndex = elements[0].index;
            if (hoverIndex !== undefined && priceData[hoverIndex]) {
              const price = priceData[hoverIndex].c;
              const item = priceData[hoverIndex];
              const date = typeof item.t === 'string' ? new Date(item.t) : new Date(item.t);
              
              // Format the date
              let formattedDate = '';
              if (selectedPeriod === '1D') {
                formattedDate = date.toLocaleTimeString([], { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              } else {
                formattedDate = date.toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
              }
              
              // Only update state if values have changed
              if (hoverPrice !== price) setHoverPrice(price);
              if (hoverDate !== formattedDate) setHoverDate(formattedDate);
              
              // Calculate change from the start of the chart to the current hover position
              if (priceData.length > 0) {
                const startPrice = priceData[0].c;
                const changeAmount = price - startPrice;
                const changePercentage = (changeAmount / startPrice) * 100;
                
                if (!hoverChange || 
                    Math.abs(hoverChange.amount - changeAmount) > 0.001 || 
                    Math.abs(hoverChange.percentage - changePercentage) > 0.001) {
                  setHoverChange({
                    amount: changeAmount,
                    percentage: changePercentage
                  });
                }
              }
            }
          });
          
          if (chartRef.current) {
            chartRef.current._lastHoverTime = Date.now();
          }
        }
      }
    },
  };

  const periods: TimePeriod[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'];

  // Handle mouse down to start dragging
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Mouse down event triggered');
    }
    
    const chart = chartRef.current;
    
    // Get the position relative to the chart
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find the nearest data point
    const element = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: false },
      false
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Elements at event:', element, 'Mouse position:', { x, y });
    }
    
    if (element && element.length > 0) {
      const index = element[0].index;
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting drag start index:', index);
      }
      setIsDragging(true);
      setDragStartIndex(index);
      setDragEndIndex(index);
      
      // Capture the mouse position for tooltip
      chart.dragEndX = x;
      chart.dragEndY = y;
      
      // Force a redraw of the chart
      chart.update();
    }
  };

  // Add a mousemove handler to track mouse position for tooltip
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    
    // Get the position relative to the chart
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isDragging) {
      // Update the mouse position for tooltip
      chart.dragEndX = x;
      chart.dragEndY = y;
      
      // Find the nearest data point
      const element = chart.getElementsAtEventForMode(
        event.nativeEvent,
        'nearest',
        { intersect: false },
        false
      );
      
      if (element && element.length > 0) {
        const index = element[0].index;
        if (dragEndIndex !== index) {
          setDragEndIndex(index);
          
          // Force a redraw of the chart
          chart.update();
        }
      }
      
      // Throttle logging to reduce updates
      if (process.env.NODE_ENV === 'development' && (!chart._lastLogTime || Date.now() - chart._lastLogTime > 100)) {
        console.log('Mouse move while dragging:', { 
          x: chart.dragEndX, 
          y: chart.dragEndY,
          isDragging,
          dragStartIndex,
          dragEndIndex
        });
        chart._lastLogTime = Date.now();
      }
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Mouse up event triggered, isDragging:', isDragging);
    }
    if (isDragging) {
      setIsDragging(false);
      
      // Force a redraw of the chart
      if (chartRef.current) {
        chartRef.current.update();
      }
    }
  };

  // Handle mouse leave to cancel dragging
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    // Reset hover states when mouse leaves the chart area
    setHoverPrice(null);
    setHoverDate(null);
    setHoverChange(null);
  };

  // Reset selection when period changes
  useEffect(() => {
    setDragStartIndex(null);
    setDragEndIndex(null);
    setSelectionChange(null);
  }, [selectedPeriod]);

  // Create a plugin to draw the selection area
  const selectionPlugin: Plugin<'line'> = {
    id: 'selectionPlugin',
    beforeDraw: (chart: any) => {
      const ctx = chart.ctx;
      
      // Always log in development to see if the plugin is being called
      if (process.env.NODE_ENV === 'development') {
        console.log('Selection plugin called', { 
          dragStartIndex, 
          dragEndIndex, 
          hasData: priceData.length > 0,
          chartInitialized: !!chart
        });
      }
      
      if (dragStartIndex !== null && dragEndIndex !== null && priceData.length > 0) {
        // Get the chart area
        const chartArea = chart.chartArea;
        
        // Get x positions for start and end indices
        const meta = chart.getDatasetMeta(0);
        if (!meta.data || meta.data.length === 0) {
          console.error('No meta data available for chart');
          return;
        }
        
        // Ensure indices are within bounds
        const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
        const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
        
        // Log the indices and meta data length
        if (process.env.NODE_ENV === 'development') {
          console.log('Drawing selection with indices:', { 
            startIdx, 
            endIdx, 
            metaDataLength: meta.data.length,
            priceDataLength: priceData.length
          });
        }
        
        // Get x positions
        const startX = meta.data[startIdx].x;
        const endX = meta.data[endIdx].x;
        
        // Log the positions
        if (process.env.NODE_ENV === 'development') {
          console.log('Selection x positions:', { startX, endX });
        }
        
        // Save the context state
        ctx.save();
        
        // Create a gradient for the selection area
        const gradient = ctx.createLinearGradient(
          Math.min(startX, endX),
          chartArea.top,
          Math.max(startX, endX),
          chartArea.top
        );
        
        // Define gradient colors based on price change direction
        const isPositiveChange = priceData[endIdx].c >= priceData[startIdx].c;
        
        if (isPositiveChange) {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)'); // Light green start
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)'); // Medium green middle
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.35)'); // Stronger green end
        } else {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)'); // Light red start
          gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)'); // Medium red middle
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.35)'); // Stronger red end
        }
        
        // Fill with gradient instead of solid color
        ctx.fillStyle = gradient;
        ctx.fillRect(
          Math.min(startX, endX),
          chartArea.top,
          Math.abs(endX - startX),
          chartArea.bottom - chartArea.top
        );
        
        // Add a more visible border at the top and bottom of the selection area
        ctx.strokeStyle = isPositiveChange ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.min(startX, endX), chartArea.top);
        ctx.lineTo(Math.max(startX, endX), chartArea.top);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(Math.min(startX, endX), chartArea.bottom);
        ctx.lineTo(Math.max(startX, endX), chartArea.bottom);
        ctx.stroke();
        
        // Draw vertical lines at start and end with improved styling
        const lineColor = isPositiveChange ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.5;
        
        // Add a subtle glow effect to the vertical lines
        ctx.shadowColor = isPositiveChange ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Start line
        ctx.beginPath();
        ctx.moveTo(startX, chartArea.top);
        ctx.lineTo(startX, chartArea.bottom);
        ctx.stroke();
        
        // End line
        ctx.beginPath();
        ctx.moveTo(endX, chartArea.top);
        ctx.lineTo(endX, chartArea.bottom);
        ctx.stroke();
        
        try {
          // Draw a thick connecting line between the points
          // First, get the y-coordinates for the start and end points from the chart data
          const startYValue = priceData[startIdx].c;
          const endYValue = priceData[endIdx].c;
          
          // Convert these values to y-coordinates on the canvas
          const yScale = chart.scales.y;
          const startY = yScale.getPixelForValue(startYValue);
          const endY = yScale.getPixelForValue(endYValue);
          
          // Log the y positions
          if (process.env.NODE_ENV === 'development') {
            console.log('Selection y positions:', { 
              startY, 
              endY, 
              startYValue, 
              endYValue 
            });
          }
          
          // SIMPLIFIED APPROACH: Draw a very obvious line
          // Draw a thick connecting line between the points
          ctx.beginPath();
          ctx.strokeStyle = isPositiveChange ? '#00FF00' : '#FF0000'; // Bright green or red
          ctx.lineWidth = 6; // Reduced from 12 to 6
          ctx.setLineDash([0]); // Solid line
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Add a white border for contrast
          ctx.beginPath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1; // Reduced from 2 to 1
          ctx.setLineDash([0]);
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Draw large circles at start and end points
          // Start point circle
          ctx.beginPath();
          ctx.fillStyle = isPositiveChange ? '#00FF00' : '#FF0000'; // Bright green or red
          ctx.arc(startX, startY, 5, 0, Math.PI * 2); // Reduced from 10 to 5
          ctx.fill();
          
          // White border for start point
          ctx.beginPath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2; // Reduced from 3 to 2
          ctx.setLineDash([0]);
          ctx.arc(startX, startY, 5, 0, Math.PI * 2); // Reduced from 10 to 5
          ctx.stroke();
          
          // End point circle
          ctx.beginPath();
          ctx.fillStyle = isPositiveChange ? '#00FF00' : '#FF0000'; // Bright green or red
          ctx.arc(endX, endY, 5, 0, Math.PI * 2); // Reduced from 10 to 5
          ctx.fill();
          
          // White border for end point
          ctx.beginPath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2; // Reduced from 3 to 2
          ctx.arc(endX, endY, 5, 0, Math.PI * 2); // Reduced from 10 to 5
          ctx.stroke();
        } catch (error) {
          console.error('Error drawing selection line:', error);
        }
        
        // Reset line dash and shadow for other drawings
        ctx.setLineDash([]);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw tooltip above the end point if we have selection data
        if (selectionChange) {
          // Get prices
          const startPrice = priceData[startIdx].c;
          const endPrice = priceData[endIdx].c;
          const diff = endPrice - startPrice;
          const percentChange = (diff / startPrice) * 100;
          
          // Format the tooltip text with larger, more visible values
          const diffText = `${startPrice.toFixed(2)} → ${endPrice.toFixed(2)}: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${diff >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
          
          // Set tooltip styles with larger font
          ctx.font = 'bold 14px Arial'; // Increased font size and made bold
          const textWidth = ctx.measureText(diffText).width;
          const padding = 12; // Increased padding
          const tooltipWidth = textWidth + (padding * 2);
          const tooltipHeight = 32; // Increased height
          
          // Calculate tooltip position, ensuring it stays within chart boundaries
          let tooltipX;
          if (isDragging && chart.dragEndX !== undefined) {
            tooltipX = Math.max(chartArea.left, Math.min(chart.dragEndX - (tooltipWidth / 2), chartArea.right - tooltipWidth));
          } else {
            tooltipX = Math.max(chartArea.left, Math.min(endX - (tooltipWidth / 2), chartArea.right - tooltipWidth));
          }
          
          // Position tooltip higher above the chart for better visibility
          const tooltipY = Math.max(5, chartArea.top - tooltipHeight - 15);
          
          // Draw tooltip background with increased opacity for better visibility
          ctx.fillStyle = diff >= 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'; // Green or red based on change
          ctx.beginPath();
          // Use a more compatible approach for rounded rectangles
          const radius = 6; // Increased radius for more rounded corners
          ctx.moveTo(tooltipX + radius, tooltipY);
          ctx.lineTo(tooltipX + tooltipWidth - radius, tooltipY);
          ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + radius);
          ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - radius);
          ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - radius, tooltipY + tooltipHeight);
          ctx.lineTo(tooltipX + radius, tooltipY + tooltipHeight);
          ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - radius);
          ctx.lineTo(tooltipX, tooltipY + radius);
          ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + radius, tooltipY);
          ctx.closePath();
          ctx.fill();
          
          // Add a subtle shadow for better visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Draw tooltip text
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(diffText, tooltipX + (tooltipWidth / 2), tooltipY + (tooltipHeight / 2));
          
          // Reset shadow for other drawings
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw a larger triangle pointer at the bottom of the tooltip
          ctx.beginPath();
          ctx.fillStyle = diff >= 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
          const pointerX = (isDragging && chart.dragEndX !== undefined) 
            ? chart.dragEndX
            : endX;
          const pointerY = tooltipY + tooltipHeight;
          ctx.moveTo(pointerX, pointerY + 10); // Make pointer larger
          ctx.lineTo(pointerX - 8, pointerY);
          ctx.lineTo(pointerX + 8, pointerY);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-md">
      {/* Price and change information */}
      {!loading && !error && priceData.length >= 2 && (
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold mr-2">
              ${selectionChange 
                ? selectionChange.endPrice.toFixed(2)
                : (hoverPrice !== null 
                  ? hoverPrice.toFixed(2) 
                  : priceData[priceData.length - 1].c.toFixed(2))}
            </span>
            {selectionChange ? (
              <div className={`flex items-center ${selectionChange.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-base font-bold">
                  {selectionChange.amount >= 0 ? '+' : ''}{selectionChange.amount.toFixed(2)} 
                </span>
                <span className="text-base font-bold ml-1">
                  ({selectionChange.amount >= 0 ? '+' : ''}{selectionChange.percentage.toFixed(2)}%)
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white bg-current">
                  Selection
                </span>
              </div>
            ) : hoverChange ? (
              <div className={`flex items-center ${hoverChange.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-sm font-medium">
                  {hoverChange.amount >= 0 ? '+' : ''}{hoverChange.amount.toFixed(2)} 
                </span>
                <span className="text-sm ml-1">
                  ({hoverChange.amount >= 0 ? '+' : ''}{hoverChange.percentage.toFixed(2)}%)
                </span>
              </div>
            ) : priceChange && (
              <div className={`flex items-center ${priceChange.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-sm font-medium">
                  {priceChange.amount >= 0 ? '+' : ''}{priceChange.amount.toFixed(2)} 
                </span>
                <span className="text-sm ml-1">
                  ({priceChange.amount >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%)
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {selectedPeriod}
                </span>
              </div>
            )}
          </div>
          {selectionChange ? (
            <div className="text-sm text-gray-500 mt-1">
              From {selectionChange.startDate} to {selectionChange.endDate}
            </div>
          ) : hoverDate && (
            <div className="text-sm text-gray-500 mt-1">
              {hoverDate}
            </div>
          )}
        </div>
      )}
      
      <div 
        className="h-80 relative"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={() => {
          if (selectionChange) {
            // Clear selection on click if there's an active selection
            setDragStartIndex(null);
            setDragEndIndex(null);
            setSelectionChange(null);
          }
        }}
      >
        {/* HTML-based selection visualization */}
        {selectionChange && dragStartIndex !== null && dragEndIndex !== null && chartRef.current && (
          <>
            {/* Fallback selection visualization - moved from center to upper area */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className={`absolute top-5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg ${
                selectionChange.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
              } text-white font-bold text-lg shadow-lg`}>
                {selectionChange.amount >= 0 ? '+' : ''}{selectionChange.amount.toFixed(2)} 
                ({selectionChange.amount >= 0 ? '+' : ''}{selectionChange.percentage.toFixed(2)}%)
              </div>
            </div>
            
            {/* Start point marker - reduced size from w-6/h-6 to w-4/h-4 */}
            <div 
              className={`absolute z-20 w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                selectionChange.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                left: (() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    return meta.data[startIdx].x + 'px';
                  } catch (e) {
                    return '50%';
                  }
                })(),
                top: (() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const startYValue = priceData[startIdx].c;
                    return yScale.getPixelForValue(startYValue) + 'px';
                  } catch (e) {
                    return '50%';
                  }
                })()
              }}
            />
            
            {/* End point marker - reduced size from w-6/h-6 to w-4/h-4 */}
            <div 
              className={`absolute z-20 w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                selectionChange.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                left: (() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    return meta.data[endIdx].x + 'px';
                  } catch (e) {
                    return '50%';
                  }
                })(),
                top: (() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const endYValue = priceData[endIdx].c;
                    return yScale.getPixelForValue(endYValue) + 'px';
                  } catch (e) {
                    return '50%';
                  }
                })()
              }}
            />
            
            {/* Connecting line using SVG for better visibility - reduced strokeWidth from 8 to 4 */}
            <svg className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
              <line
                x1={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    return meta.data[startIdx].x;
                  } catch (e) {
                    return 0;
                  }
                })()}
                y1={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const startYValue = priceData[startIdx].c;
                    return yScale.getPixelForValue(startYValue);
                  } catch (e) {
                    return 0;
                  }
                })()}
                x2={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    return meta.data[endIdx].x;
                  } catch (e) {
                    return 0;
                  }
                })()}
                y2={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const endYValue = priceData[endIdx].c;
                    return yScale.getPixelForValue(endYValue);
                  } catch (e) {
                    return 0;
                  }
                })()}
                stroke={selectionChange.amount >= 0 ? '#00FF00' : '#FF0000'}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    return meta.data[startIdx].x;
                  } catch (e) {
                    return 0;
                  }
                })()}
                y1={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const startIdx = Math.min(Math.max(0, dragStartIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const startYValue = priceData[startIdx].c;
                    return yScale.getPixelForValue(startYValue);
                  } catch (e) {
                    return 0;
                  }
                })()}
                x2={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    return meta.data[endIdx].x;
                  } catch (e) {
                    return 0;
                  }
                })()}
                y2={(() => {
                  try {
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    const endIdx = Math.min(Math.max(0, dragEndIndex), meta.data.length - 1);
                    const yScale = chart.scales.y;
                    const endYValue = priceData[endIdx].c;
                    return yScale.getPixelForValue(endYValue);
                  } catch (e) {
                    return 0;
                  }
                })()}
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="3,3"
              />
            </svg>
          </>
        )}
        
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
          <Line 
            data={chartData} 
            options={chartOptions} 
            plugins={[selectionPlugin]}
            ref={chartRef}
          />
        )}
      </div>
      
      <div className="flex justify-between items-center mt-4 border-t border-gray-200 pt-4">
        <div className="flex space-x-4">
          {periods.map((period) => (
            <button
              key={period}
              className={`px-2 py-1 text-sm rounded ${
                selectedPeriod === period
                  ? 'text-blue-500 font-medium bg-blue-500 bg-opacity-10'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
        
        <button 
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={() => alert(debugInfo)}
        >
          Debug ({priceData.length} points)
        </button>
      </div>
    </div>
  );
};

export default StockPriceChart; 