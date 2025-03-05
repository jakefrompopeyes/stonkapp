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
        
        console.log(`ValuationStats - Starting data fetch for ticker: ${ticker}`);
        
        // Fetch data from APIs
        const [metricsData, stockDetails] = await Promise.all([
          getValuationMetrics(ticker),
          getStockDetails(ticker)
        ]);
        
        console.log('ValuationStats - FULL metrics data:', JSON.stringify(metricsData, null, 2));
        console.log('ValuationStats - FULL stock details:', JSON.stringify(stockDetails, null, 2));
        console.log('ValuationStats - book value:', metricsData.bookValue);
        console.log('ValuationStats - shares outstanding:', metricsData.sharesOutstanding);
        console.log('ValuationStats - book value per share from API:', metricsData.bookValuePerShare);
        console.log('ValuationStats - stock details shares outstanding:', stockDetails.shares_outstanding);
        
        // If metrics doesn't have shares outstanding but stock details does, use that
        if (!metricsData.sharesOutstanding && stockDetails.shares_outstanding) {
          console.log('Using shares outstanding from stock details:', stockDetails.shares_outstanding);
          metricsData.sharesOutstanding = stockDetails.shares_outstanding;
          
          // Recalculate book value per share if we now have both values
          if (metricsData.bookValue && !metricsData.bookValuePerShare) {
            metricsData.bookValuePerShare = metricsData.bookValue / metricsData.sharesOutstanding;
            console.log('Recalculated book value per share:', metricsData.bookValuePerShare);
          }
        }
        
        console.log('ValuationStats - FINAL metrics data after adjustments:', JSON.stringify(metricsData, null, 2));
        
        setMetrics(metricsData);
        setMarketCap(stockDetails.market_cap || null);
        
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
    console.log(`Creating donut data for ${label} with ratio: ${ratio}`);
    
    if (ratio === null) {
      console.log(`${label} ratio is null, returning 'No Data'`);
      return {
        datasets: [
          {
            data: [1, 0],
            backgroundColor: ['#e0e0e0', '#e0e0e0'], // Gray color
            borderWidth: 0,
          },
        ],
        labels: ['No Data', ''],
      };
    }
    
    let fillPercentage = 0;
    
    if (label === 'Book Value Per Share') {
      // For Book Value Per Share, we're displaying the raw value, not a ratio
      // Higher book value is better, so we'll fill more of the chart for higher values
      fillPercentage = Math.min(1, ratio / 100); // Scale for better visibility
      console.log(`Book Value Per Share fill calculation: ${fillPercentage}`);
    } else if (label === 'P/E') {
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

  // Get book value per share directly from the API
  const bookValuePerShare = metrics?.bookValuePerShare || null;
  console.log('Book Value Per Share from API:', bookValuePerShare);

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading valuation metrics...</div>;
  }

  if (error) {
    return <div className="p-4 bg-white rounded-lg shadow-md text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div className="p-4 bg-white rounded-lg shadow-md">No valuation data available</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Valuation Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PE Ratio */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut data={createDonutData(metrics?.peAnnual || null, 'P/E')} options={chartOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-medium">P/E</span>
              <span className="text-lg font-bold">{metrics?.peAnnual ? metrics.peAnnual.toFixed(2) : 'N/A'}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Price to Earnings ratio. Lower values may indicate better value.
          </p>
        </div>

        {/* PS Ratio */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut data={createDonutData(metrics?.psAnnual || null, 'P/S')} options={chartOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-medium">P/S</span>
              <span className="text-lg font-bold">{metrics?.psAnnual ? metrics.psAnnual.toFixed(2) : 'N/A'}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Price to Sales ratio. Lower values may indicate better value.
          </p>
        </div>

        {/* Book Value Per Share */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut 
              data={createDonutData(bookValuePerShare, 'Book Value Per Share')} 
              options={chartOptions} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-medium">Book Value</span>
              <span className="text-lg font-bold">
                {bookValuePerShare ? `$${Number(bookValuePerShare).toFixed(2)}` : 'N/A'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Book Value Per Share = Outstanding Shares / Shareholder Equity
          </p>
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