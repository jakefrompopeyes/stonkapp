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
import { getKeyMetrics, getEnterpriseValue } from '@/lib/fmpApi';

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
  const [evToEBITDA, setEvToEBITDA] = useState<number | null>(null);
  const [evToRevenue, setEvToRevenue] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch valuation metrics, stock details, and FMP metrics in parallel
        const [metricsData, stockDetails, keyMetrics, enterpriseValue] = await Promise.all([
          getValuationMetrics(ticker),
          getStockDetails(ticker),
          getKeyMetrics(ticker),
          getEnterpriseValue(ticker)
        ]);
        
        console.log('FMP Key Metrics:', keyMetrics);
        console.log('FMP Enterprise Value:', enterpriseValue);
        
        // Set the basic metrics from Finnhub
        setMetrics(metricsData);
        setMarketCap(stockDetails.market_cap || null);
        
        // Set the EV/EBITDA and EV/Revenue from FMP
        if (keyMetrics && enterpriseValue) {
          // Calculate EV/EBITDA
          if (keyMetrics.ebitda && enterpriseValue.enterpriseValue) {
            const evEbitdaRatio = enterpriseValue.enterpriseValue / keyMetrics.ebitda;
            setEvToEBITDA(evEbitdaRatio);
            
            // Update the metrics object with the new value
            metricsData.evToEBITDA = evEbitdaRatio;
          }
          
          // Calculate EV/Revenue
          if (keyMetrics.revenue && enterpriseValue.enterpriseValue) {
            const evRevenueRatio = enterpriseValue.enterpriseValue / keyMetrics.revenue;
            setEvToRevenue(evRevenueRatio);
            
            // Update the metrics object with the new value
            metricsData.evToRevenue = evRevenueRatio;
          }
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
    if (!ratio || ratio <= 0 || !marketCapValue || marketCapValue <= 0) {
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
    
    // Set a reasonable maximum value based on the type of ratio
    const maxValue = label.includes('PE') ? marketCapValue / 10 : marketCapValue / 3;
    const remainingValue = Math.max(0, maxValue - value);

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
      <div className="grid grid-cols-2 gap-4">
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
            <Doughnut data={createDonutData(metrics.evToEBITDA ?? null, marketCap, 'EV/EBITDA')} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.evToEBITDA?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">EV/EBITDA</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <Doughnut data={createDonutData(metrics.evToRevenue ?? null, marketCap, 'EV/Revenue')} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold">{metrics.evToRevenue?.toFixed(1) || 'N/A'}x</span>
              <span className="text-xs text-gray-500">EV/Revenue</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Market Cap: {formatLargeNumber(marketCap)}</p>
        <p>PE Ratio: Price to Earnings - Lower values may indicate better value</p>
        <p>PS Ratio: Price to Sales - Lower values may indicate better value</p>
        <p>EV/EBITDA: Enterprise Value to EBITDA - Lower values suggest the company might be undervalued</p>
        <p>EV/Revenue: Enterprise Value to Revenue - Lower values indicate potentially better value</p>
      </div>
    </div>
  );
};

export default ValuationStats; 