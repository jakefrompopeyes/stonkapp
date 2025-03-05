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
        console.log('ValuationStats - stock details:', stockDetails);
        
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
  const createDonutData = (ratio: number | null, marketCapValue: number | null, label: string) => {
    console.log(`createDonutData called with ratio: ${ratio}, marketCapValue: ${marketCapValue}, label: ${label}`);
    
    // Special case for Book Value where we're passing the raw value
    if (label === 'Book Value') {
      if (!ratio || ratio <= 0) {
        console.log(`createDonutData returning 'No Data' for ${label} because value is invalid`);
        return {
          labels: ['No Data'],
          datasets: [
            {
              data: [1],
              backgroundColor: ['#e0e0e0'],
              borderWidth: 0,
            },
          ],
        };
      }
      
      console.log(`createDonutData using raw value: ${ratio} for ${label}`);
      
      // For Book Value, we'll just show the value itself with a fixed maximum
      const maxValue = ratio * 2; // Use twice the book value as the maximum
      const remainingValue = maxValue - ratio;
      
      console.log(`createDonutData maxValue: ${maxValue}, remainingValue: ${remainingValue} for ${label}`);
      
      return {
        labels: [label, ''],
        datasets: [
          {
            data: [ratio, remainingValue],
            backgroundColor: [
              '#4F46E5', // Indigo for the value
              '#E5E7EB', // Light gray for the remaining space
            ],
            borderWidth: 0,
          },
        ],
      };
    }
    
    // Original logic for other ratios
    if (!ratio || ratio <= 0 || !marketCapValue || marketCapValue <= 0) {
      console.log(`createDonutData returning 'No Data' for ${label} because ratio or marketCapValue is invalid`);
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#e0e0e0'],
            borderWidth: 0,
          },
        ],
      };
    }

    // Calculate market cap divided by the ratio
    const value = marketCapValue / ratio;
    console.log(`createDonutData calculated value: ${value} for ${label}`);
    
    // Set a reasonable maximum value based on the type of ratio
    const maxValue = label.includes('PE') ? marketCapValue / 10 : marketCapValue / 3;
    const remainingValue = Math.max(0, maxValue - value);
    console.log(`createDonutData maxValue: ${maxValue}, remainingValue: ${remainingValue} for ${label}`);

    return {
      labels: [label, ''],
      datasets: [
        {
          data: [value, remainingValue],
          backgroundColor: [
            '#4F46E5', // Indigo for the value
            '#E5E7EB', // Light gray for the remaining space
          ],
          borderWidth: 0,
        },
      ],
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
            <Doughnut data={createDonutData(metrics.peAnnual ?? null, marketCap, 'PE Annual')} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.peAnnual?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">PE Annual</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut data={createDonutData(metrics.psAnnual ?? null, marketCap, 'PS Annual')} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.psAnnual?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">PS Annual</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            {/* Debug log for P/B chart rendering */}
            {(() => { console.log('Rendering P/B chart - bookValue:', metrics.bookValue, 'marketCap:', marketCap); return null; })()}
            <Doughnut 
              data={createDonutData(
                // Just pass the raw book value directly, not as a ratio with market cap
                metrics.bookValue ?? null, 
                marketCap, 
                'Book Value'
              )} 
              options={chartOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{formatLargeNumber(metrics.bookValue)}</span>
              <span className="text-xs text-gray-500">Book Value</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Market Cap: {formatLargeNumber(marketCap)}</p>
        <p>PE Ratio: Price to Earnings - Lower values may indicate better value</p>
        <p>PS Ratio: Price to Sales - Lower values may indicate better value</p>
        <p>Book Value: Total shareholders' equity - Higher values may indicate stronger financial position</p>
        {metrics.bookValue && marketCap && <p>P/B Ratio: {(marketCap / metrics.bookValue).toFixed(2)}x - Price to Book - Lower values may indicate better value</p>}
      </div>
    </div>
  );
};

export default ValuationStats; 