'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ValuationMetrics, getValuationMetrics, getStockDetails } from '@/lib/stockApi';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface ValuationStatsProps {
  ticker: string;
}

const ValuationStats: React.FC<ValuationStatsProps> = ({ ticker }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ValuationMetrics | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from APIs
        const [metricsData, stockDetails] = await Promise.all([
          getValuationMetrics(ticker),
          getStockDetails(ticker)
        ]);
        
        console.log('ValuationStats - metrics data:', metricsData);
        console.log('ValuationStats - book value:', metricsData.bookValue);
        console.log('ValuationStats - shares outstanding:', metricsData.sharesOutstanding);
        console.log('ValuationStats - stock details:', stockDetails);
        console.log('ValuationStats - market cap:', stockDetails.market_cap);
        console.log('ValuationStats - stock details shares outstanding:', stockDetails.shares_outstanding);
        
        // If metrics doesn't have shares outstanding but stock details does, use that
        if (!metricsData.sharesOutstanding && stockDetails.shares_outstanding) {
          metricsData.sharesOutstanding = stockDetails.shares_outstanding;
          console.log('Using shares outstanding from stock details:', stockDetails.shares_outstanding);
        }
        
        setMetrics(metricsData);
        setMarketCap(stockDetails.market_cap || null);
        
        console.log('ValuationStats - book value:', metricsData.bookValue);
        console.log('ValuationStats - market cap:', stockDetails.market_cap);
        if (metricsData.bookValue && stockDetails.market_cap) {
          console.log('ValuationStats - P/B ratio:', stockDetails.market_cap / metricsData.bookValue);
        } else {
          console.log('ValuationStats - Cannot calculate P/B ratio, missing data');
        }
      } catch (err) {
        console.error('Error fetching valuation data:', err);
        setError('Failed to load valuation metrics');
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchData();
    }
  }, [ticker]);

  // Format large numbers with abbreviations (K, M, B, T)
  const formatLargeNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    
    return value.toFixed(2);
  };

  // Helper function to create donut chart data
  const createDonutData = (ratio: number | null, label: string) => {
    console.log(`Creating donut data for ${label} with value:`, ratio);
    
    // If no data is available
    if (!ratio || ratio <= 0) {
      console.log(`No valid data for ${label}, showing empty chart`);
      return {
        datasets: [
          {
            data: [1],
            backgroundColor: ['#e0e0e0'],
            borderWidth: 0,
          },
        ],
        labels: ['No Data'],
      };
    }
    
    // Special case for Book Value Per Share
    if (label === 'Book Value Per Share') {
      console.log(`Rendering Book Value Per Share chart with value: ${ratio}`);
      // For Book Value Per Share, use a fixed scale to show a portion of the circle
      return {
        datasets: [
          {
            data: [1, 2], // 1/3 of the circle filled
            backgroundColor: ['#3b82f6', '#e0e0e0'], // Blue color
            borderWidth: 0,
          },
        ],
        labels: [label, 'Scale'],
      };
    }
    
    // For PE and PS ratios
    console.log(`Rendering ${label} chart with ratio: ${ratio}`);
    
    // Calculate how much of the chart to fill based on the ratio
    // Lower ratios (better value) should fill more of the chart
    let fillPercentage;
    if (label === 'PE Annual') {
      // For PE, consider anything below 15 as good value
      fillPercentage = Math.min(1, 15 / Math.max(1, ratio));
    } else {
      // For PS, consider anything below 2 as good value
      fillPercentage = Math.min(1, 2 / Math.max(0.1, ratio));
    }
    
    // Convert to a ratio for the chart (filled vs empty)
    const filledPart = fillPercentage * 3; // Scale for better visibility
    const emptyPart = 3 - filledPart;
    
    console.log(`${label} fill calculation: ${fillPercentage} -> [${filledPart}, ${emptyPart}]`);
    
    return {
      datasets: [
        {
          data: [filledPart, emptyPart],
          backgroundColor: ['#3b82f6', '#e0e0e0'], // Blue color
          borderWidth: 0,
        },
      ],
      labels: [label, 'Scale'],
    };
  };

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataIndex === 0 && context.dataset.data[0] !== 1) {
              return `${context.label}: ${formatLargeNumber(context.dataset.data[0] as number)}`;
            }
            return '';
          }
        }
      }
    },
  };

  // Use book value per share directly from the API if available
  const getBookValuePerShare = () => {
    // First try to use the pre-calculated value from the API
    if (metrics?.bookValuePerShare) {
      console.log(`Using pre-calculated book value per share from API: ${metrics.bookValuePerShare}`);
      return metrics.bookValuePerShare;
    }
    
    // Otherwise calculate it ourselves
    if (!metrics?.bookValue || !metrics?.sharesOutstanding) {
      console.log('Cannot calculate book value per share - missing data:', {
        bookValue: metrics?.bookValue,
        sharesOutstanding: metrics?.sharesOutstanding
      });
      return null;
    }
    
    // Book Value Per Share = Total Shareholder Equity / Shares Outstanding
    const result = metrics.bookValue / metrics.sharesOutstanding;
    console.log(`Calculated book value per share: ${result}`);
    return result;
  };

  const bookValuePerShare = getBookValuePerShare();

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading valuation metrics...</div>;
  }

  if (error) {
    return <div className="p-4 bg-white rounded-lg shadow-md text-red-500">{error}</div>;
  }

  if (!metrics || !marketCap) {
    return <div className="p-4 bg-white rounded-lg shadow-md">No valuation data available</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Valuation Stats</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut 
              data={createDonutData(metrics.peAnnual ?? null, 'PE Annual')} 
              options={chartOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.peAnnual?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">PE Annual</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut 
              data={createDonutData(metrics.psAnnual ?? null, 'PS Annual')} 
              options={chartOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.psAnnual?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">PS Annual</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut 
              data={createDonutData(bookValuePerShare, 'Book Value Per Share')} 
              options={chartOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">
                {bookValuePerShare ? `$${bookValuePerShare.toFixed(2)}` : 'N/A'}
              </span>
              <span className="text-xs text-gray-500">Book Value/Share</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Market Cap: {formatLargeNumber(marketCap)}</p>
        <p>PE Ratio: Price to Earnings - Lower values may indicate better value</p>
        <p>PS Ratio: Price to Sales - Lower values may indicate better value</p>
        <p>Book Value Per Share: Total shareholders' equity divided by shares outstanding</p>
        {metrics?.bookValue && marketCap && (
          <p>
            P/B Ratio: {(marketCap / metrics.bookValue).toFixed(2)}x - 
            Price to Book - Lower values may indicate better value
          </p>
        )}
      </div>
    </div>
  );
};

export default ValuationStats; 