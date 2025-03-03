'use client';

import React, { useState, useEffect } from 'react';
import {
  getFinancialRatiosTTM,
} from '@/lib/fmpApi';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ProfitabilityMetricsProps {
  ticker: string;
}

interface ProfitabilityData {
  // Financial Ratios TTM
  returnOnEquityTTM?: number;
  returnOnAssetsTTM?: number;
  operatingProfitMarginTTM?: number;
  netProfitMarginTTM?: number;
}

/**
 * ProfitabilityMetrics Component
 * 
 * Displays key profitability metrics for a company:
 * - Return on Equity (ROE) = Net Income / Total Stockholder Equity
 * - Return on Assets (ROA) = Net Income / Total Assets
 * - Operating Profit Margin = Operating Income / Revenue
 * - Net Profit Margin = Net Income / Revenue
 * 
 * Data is fetched from the FMP API's ratios-ttm endpoint.
 */
const ProfitabilityMetrics: React.FC<ProfitabilityMetricsProps> = ({ ticker }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData>({});

  useEffect(() => {
    const fetchProfitabilityData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch financial ratios data
        const ratios = await getFinancialRatiosTTM(ticker);

        if (!ratios) {
          throw new Error('Failed to fetch financial ratios');
        }

        // The FMP API returns these values as decimals (not percentages)
        // For example, 0.15 means 15%
        setProfitabilityData({
          // Financial Ratios TTM
          returnOnEquityTTM: ratios.returnOnEquityTTM,
          returnOnAssetsTTM: ratios.returnOnAssetsTTM,
          operatingProfitMarginTTM: ratios.operatingProfitMarginTTM,
          netProfitMarginTTM: ratios.netProfitMarginTTM,
        });
      } catch (err) {
        console.error('Error fetching profitability data:', err);
        setError('Failed to load profitability metrics');
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchProfitabilityData();
    }
  }, [ticker]);

  const formatNumber = (value: number | undefined, decimals: number = 2, suffix: string = '') => {
    if (value === undefined || value === null) return 'N/A';
    
    // Convert to percentage if the value is a decimal and suffix is '%'
    if (suffix === '%' && Math.abs(value) < 1) {
      value = value * 100;
    }
    
    return `${value.toFixed(decimals)}${suffix}`;
  };

  // Prepare data for profitability charts
  const prepareROEChartData = () => {
    // ROE values from the API are already in decimal form (e.g., 0.15 for 15%)
    // For the chart, we need to convert to percentage (0-100 scale)
    const value = profitabilityData.returnOnEquityTTM ? profitabilityData.returnOnEquityTTM * 100 : 0;
    
    // Cap at 100% for the chart visualization
    const cappedValue = Math.min(value, 100);
    
    return {
      labels: ['ROE', 'Remaining'],
      datasets: [{
        data: [cappedValue, Math.max(0, 100 - cappedValue)],
        backgroundColor: [
          '#4F46E5', // Indigo for the value
          '#E5E7EB', // Light gray for the remaining space
        ],
        borderWidth: 0,
        cutout: '70%',
      }]
    };
  };

  const prepareROAChartData = () => {
    // ROA values from the API are already in decimal form (e.g., 0.05 for 5%)
    // For the chart, we need to convert to percentage (0-100 scale)
    const value = profitabilityData.returnOnAssetsTTM ? profitabilityData.returnOnAssetsTTM * 100 : 0;
    
    // Cap at 100% for the chart visualization
    const cappedValue = Math.min(value, 100);
    
    return {
      labels: ['ROA', 'Remaining'],
      datasets: [{
        data: [cappedValue, Math.max(0, 100 - cappedValue)],
        backgroundColor: [
          '#10B981', // Green for the value
          '#E5E7EB', // Light gray for the remaining space
        ],
        borderWidth: 0,
        cutout: '70%',
      }]
    };
  };

  const prepareMarginsChartData = () => {
    // Margin values from the API are already in decimal form (e.g., 0.25 for 25%)
    // For the chart, we need to convert to percentage (0-100 scale)
    const operatingMargin = profitabilityData.operatingProfitMarginTTM ? profitabilityData.operatingProfitMarginTTM * 100 : 0;
    const netMargin = profitabilityData.netProfitMarginTTM ? profitabilityData.netProfitMarginTTM * 100 : 0;
    
    return {
      labels: ['Operating Margin', 'Net Margin'],
      datasets: [{
        label: 'Profit Margins (%)',
        data: [operatingMargin, netMargin],
        backgroundColor: [
          '#3B82F6', // Blue for operating margin
          '#8B5CF6', // Purple for net margin
        ],
        borderWidth: 1,
        borderRadius: 6,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return `${context.label}: ${value.toFixed(2)}%`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return `${context.label}: ${value.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading profitability metrics...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Convert decimal values to percentages for display
  const roePercentage = profitabilityData.returnOnEquityTTM ? profitabilityData.returnOnEquityTTM * 100 : undefined;
  const roaPercentage = profitabilityData.returnOnAssetsTTM ? profitabilityData.returnOnAssetsTTM * 100 : undefined;
  const operatingMarginPercentage = profitabilityData.operatingProfitMarginTTM ? profitabilityData.operatingProfitMarginTTM * 100 : undefined;
  const netMarginPercentage = profitabilityData.netProfitMarginTTM ? profitabilityData.netProfitMarginTTM * 100 : undefined;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Profitability Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ROE Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-center">Return on Equity (ROE)</h3>
          <div className="h-48 relative">
            <Doughnut data={prepareROEChartData()} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{formatNumber(roePercentage, 2, '%')}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 text-center">
            ROE measures how efficiently a company uses its equity to generate profits.
          </p>
        </div>
        
        {/* ROA Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-center">Return on Assets (ROA)</h3>
          <div className="h-48 relative">
            <Doughnut data={prepareROAChartData()} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{formatNumber(roaPercentage, 2, '%')}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 text-center">
            ROA indicates how profitable a company is relative to its total assets.
          </p>
        </div>
        
        {/* Profit Margins Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-center">Profit Margins</h3>
          <div className="h-48">
            <Bar data={prepareMarginsChartData()} options={barChartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Operating Margin:</span>
              <span className="font-medium">{formatNumber(operatingMarginPercentage, 2, '%')}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Margin:</span>
              <span className="font-medium">{formatNumber(netMarginPercentage, 2, '%')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityMetrics; 