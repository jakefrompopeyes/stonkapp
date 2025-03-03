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

        setProfitabilityData({
          // Financial Ratios TTM
          returnOnEquityTTM: ratios?.returnOnEquityTTM,
          returnOnAssetsTTM: ratios?.returnOnAssetsTTM,
          operatingProfitMarginTTM: ratios?.operatingProfitMarginTTM,
          netProfitMarginTTM: ratios?.netProfitMarginTTM,
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
    return `${value.toFixed(decimals)}${suffix}`;
  };

  // Prepare data for profitability charts
  const prepareROEChartData = () => {
    const value = profitabilityData.returnOnEquityTTM || 0;
    return {
      labels: ['ROE', 'Remaining'],
      datasets: [{
        data: [value, Math.max(0, 100 - value)],
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
    const value = profitabilityData.returnOnAssetsTTM || 0;
    return {
      labels: ['ROA', 'Remaining'],
      datasets: [{
        data: [value, Math.max(0, 100 - value)],
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
    return {
      labels: ['Operating Margin', 'Net Margin'],
      datasets: [{
        label: 'Profit Margins (%)',
        data: [
          profitabilityData.operatingProfitMarginTTM || 0,
          profitabilityData.netProfitMarginTTM || 0
        ],
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
              <span className="text-2xl font-bold">{formatNumber(profitabilityData.returnOnEquityTTM, 2, '%')}</span>
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
              <span className="text-2xl font-bold">{formatNumber(profitabilityData.returnOnAssetsTTM, 2, '%')}</span>
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
              <span className="font-medium">{formatNumber(profitabilityData.operatingProfitMarginTTM, 2, '%')}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Margin:</span>
              <span className="font-medium">{formatNumber(profitabilityData.netProfitMarginTTM, 2, '%')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityMetrics; 