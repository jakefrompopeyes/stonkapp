'use client';

import React, { useState, useEffect } from 'react';
import { getKeyMetricsTTM, getFinancialRatiosTTM } from '@/lib/fmpApi';

interface FinancialHealthVisualized {
  ticker: string;
}

interface FinancialMetrics {
  currentRatioTTM?: number;
  quickRatioTTM?: number;
  debtToEquityTTM?: number;
  debtToAssetsTTM?: number;
  interestCoverageTTM?: number;
  cashRatioTTM?: number;
}

const FinancialHealthVisualized: React.FC<FinancialHealthVisualized> = ({ ticker }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetrics>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [keyMetrics, ratios] = await Promise.all([
          getKeyMetricsTTM(ticker),
          getFinancialRatiosTTM(ticker)
        ]);

        setMetrics({
          currentRatioTTM: keyMetrics?.currentRatioTTM,
          quickRatioTTM: keyMetrics?.quickRatioTTM,
          debtToEquityTTM: keyMetrics?.debtToEquityTTM,
          debtToAssetsTTM: keyMetrics?.debtToAssetsTTM,
          interestCoverageTTM: ratios?.interestCoverageTTM,
          cashRatioTTM: keyMetrics?.cashRatioTTM
        });
      } catch (err) {
        console.error('Error fetching financial health metrics:', err);
        setError('Failed to load financial health metrics');
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchData();
    }
  }, [ticker]);

  const getHealthScore = (value: number | undefined, thresholds: { poor: number; fair: number; good: number }) => {
    if (value === undefined) return { score: 0, status: 'unknown' };
    
    if (value >= thresholds.good) return { score: 100, status: 'good' };
    if (value >= thresholds.fair) return { score: 60, status: 'fair' };
    if (value >= thresholds.poor) return { score: 30, status: 'poor' };
    return { score: 0, status: 'critical' };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      good: 'bg-green-500',
      fair: 'bg-yellow-500',
      poor: 'bg-orange-500',
      critical: 'bg-red-500',
      unknown: 'bg-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.unknown;
  };

  const formatNumber = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  const MetricGauge: React.FC<{
    label: string;
    value: number | undefined;
    thresholds: { poor: number; fair: number; good: number };
    description: string;
  }> = ({ label, value, thresholds, description }) => {
    const { score, status } = getHealthScore(value, thresholds);
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <span className="text-lg font-semibold">{formatNumber(value)}</span>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getStatusColor(status)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Critical</span>
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
        </div>
        
        <p className="text-xs text-gray-600 mt-2">{description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
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
      <h2 className="text-xl font-semibold mb-6">Financial Health Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricGauge
          label="Current Ratio"
          value={metrics.currentRatioTTM}
          thresholds={{ poor: 1, fair: 1.5, good: 2 }}
          description="Measures ability to pay short-term obligations. Higher is better, with 2.0+ considered healthy."
        />
        
        <MetricGauge
          label="Quick Ratio"
          value={metrics.quickRatioTTM}
          thresholds={{ poor: 0.5, fair: 0.9, good: 1.2 }}
          description="Similar to current ratio but excludes inventory. Above 1.0 indicates strong liquidity."
        />
        
        <MetricGauge
          label="Cash Ratio"
          value={metrics.cashRatioTTM}
          thresholds={{ poor: 0.2, fair: 0.5, good: 0.75 }}
          description="Most conservative liquidity ratio. Shows ability to cover short-term liabilities with cash."
        />
        
        <MetricGauge
          label="Debt to Equity"
          value={metrics.debtToEquityTTM}
          thresholds={{ poor: 2, fair: 1.5, good: 1 }}
          description="Shows financial leverage. Lower ratios indicate less risk, with under 1.0 considered conservative."
        />
        
        <MetricGauge
          label="Debt to Assets"
          value={metrics.debtToAssetsTTM}
          thresholds={{ poor: 0.7, fair: 0.5, good: 0.3 }}
          description="Percentage of assets financed by debt. Lower values indicate stronger solvency."
        />
        
        <MetricGauge
          label="Interest Coverage"
          value={metrics.interestCoverageTTM}
          thresholds={{ poor: 1.5, fair: 3, good: 5 }}
          description="Shows ability to pay interest on debt. Higher ratios indicate stronger debt service capability."
        />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Overall Financial Health</h3>
        <p className="text-sm text-gray-600">
          This analysis considers multiple aspects of financial health including liquidity (current, quick, and cash ratios), 
          solvency (debt ratios), and debt service capability (interest coverage). Each metric is color-coded and scored 
          relative to industry standards, with green indicating strong performance and red indicating potential concerns.
        </p>
      </div>
    </div>
  );
};

export default FinancialHealthVisualized; 