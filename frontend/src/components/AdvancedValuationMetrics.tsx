'use client';

import React, { useState, useEffect } from 'react';
import {
  getKeyMetricsTTM,
  getFinancialRatiosTTM,
  getCompanyRating,
  getFinancialScore,
  getCompanyProfile
} from '@/lib/fmpApi';

interface AdvancedValuationMetricsProps {
  ticker: string;
}

interface ValuationData {
  // Key Metrics TTM
  peRatioTTM?: number;
  priceToBookRatioTTM?: number;
  currentRatioTTM?: number;
  quickRatioTTM?: number;
  debtToEquityTTM?: number;
  debtToAssetsTTM?: number;
  
  // Company Rating
  rating?: string;
  ratingScore?: number;
  ratingRecommendation?: string;
  
  // Financial Score
  altmanZScore?: number;
  piotroskiScore?: number;
  
  // Company Profile
  mktCap?: number;
  enterpriseValue?: number;
}

const AdvancedValuationMetrics: React.FC<AdvancedValuationMetricsProps> = ({ ticker }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valuationData, setValuationData] = useState<ValuationData>({});

  useEffect(() => {
    const fetchValuationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          keyMetrics,
          ratios,
          rating,
          score,
          profile
        ] = await Promise.all([
          getKeyMetricsTTM(ticker),
          getFinancialRatiosTTM(ticker),
          getCompanyRating(ticker),
          getFinancialScore(ticker),
          getCompanyProfile(ticker)
        ]);

        setValuationData({
          // Key Metrics TTM
          peRatioTTM: keyMetrics?.peRatioTTM,
          priceToBookRatioTTM: keyMetrics?.pbRatioTTM,
          currentRatioTTM: keyMetrics?.currentRatioTTM,
          quickRatioTTM: keyMetrics?.quickRatioTTM,
          debtToEquityTTM: keyMetrics?.debtToEquityTTM,
          debtToAssetsTTM: keyMetrics?.debtToAssetsTTM,
          
          // Company Rating
          rating: rating?.rating,
          ratingScore: rating?.ratingScore,
          ratingRecommendation: rating?.ratingRecommendation,
          
          // Financial Score
          altmanZScore: score?.altmanZScore,
          piotroskiScore: score?.piotroskiScore,
          
          // Company Profile
          mktCap: profile?.mktCap,
          enterpriseValue: profile?.enterpriseValue
        });
      } catch (err) {
        console.error('Error fetching valuation data:', err);
        setError('Failed to load valuation metrics');
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchValuationData();
    }
  }, [ticker]);

  const formatNumber = (value: number | undefined, decimals: number = 2, suffix: string = '') => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(decimals)}${suffix}`;
  };

  const formatLargeNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const getRatingColor = (rating: string | undefined) => {
    if (!rating) return 'text-gray-500';
    const ratingMap: { [key: string]: string } = {
      'Strong Buy': 'text-green-600',
      'Buy': 'text-green-500',
      'Hold': 'text-yellow-500',
      'Sell': 'text-red-500',
      'Strong Sell': 'text-red-600'
    };
    return ratingMap[rating] || 'text-gray-500';
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading advanced valuation metrics...</div>;
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
      <h2 className="text-xl font-semibold mb-4">Advanced Valuation Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Valuation Metrics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Valuation Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">P/E Ratio</span>
              <span className="font-medium">{formatNumber(valuationData.peRatioTTM)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">P/B Ratio</span>
              <span className="font-medium">{formatNumber(valuationData.priceToBookRatioTTM)}</span>
            </div>
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Financial Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Ratio</span>
              <span className="font-medium">{formatNumber(valuationData.currentRatioTTM)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quick Ratio</span>
              <span className="font-medium">{formatNumber(valuationData.quickRatioTTM)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Debt/Equity</span>
              <span className="font-medium">{formatNumber(valuationData.debtToEquityTTM)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Debt/Assets</span>
              <span className="font-medium">{formatNumber(valuationData.debtToAssetsTTM)}</span>
            </div>
          </div>
        </div>

        {/* Company Rating */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Company Rating</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Rating</span>
              <span className={`font-medium ${getRatingColor(valuationData.rating)}`}>
                {valuationData.rating || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rating Score</span>
              <span className="font-medium">{formatNumber(valuationData.ratingScore)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recommendation</span>
              <span className={`font-medium ${getRatingColor(valuationData.ratingRecommendation)}`}>
                {valuationData.ratingRecommendation || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Scores */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Financial Scores</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Altman Z-Score</span>
              <span className="font-medium">{formatNumber(valuationData.altmanZScore)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Piotroski Score</span>
              <span className="font-medium">{formatNumber(valuationData.piotroskiScore)}</span>
            </div>
          </div>
        </div>

        {/* Market Value */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Market Value</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Enterprise Value</span>
              <span className="font-medium">${formatLargeNumber(valuationData.enterpriseValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap</span>
              <span className="font-medium">${formatLargeNumber(valuationData.mktCap)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedValuationMetrics; 