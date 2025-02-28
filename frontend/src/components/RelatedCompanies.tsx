'use client';

import { useState, useEffect } from 'react';
import { getRelatedCompanies, RelatedCompany } from '@/lib/stockApiNew';
import Link from 'next/link';

interface RelatedCompaniesProps {
  ticker: string;
}

export default function RelatedCompanies({ ticker }: RelatedCompaniesProps) {
  const [companies, setCompanies] = useState<RelatedCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedCompanies = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch related companies
        const relatedCompaniesData = await getRelatedCompanies(ticker);
        console.log('Related companies data:', relatedCompaniesData);
        
        // Filter out companies with missing data
        const filteredCompanies = relatedCompaniesData.filter(
          company => company.ticker && company.name
        );
        
        // Limit to top 6 companies for grid layout
        const topCompanies = filteredCompanies.slice(0, 6);
        
        setCompanies(topCompanies);
      } catch (err) {
        console.error('Error fetching related companies:', err);
        setError('Failed to load related companies data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedCompanies();
  }, [ticker]);

  // Format currency
  const formatCurrency = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format market cap in billions/millions
  const formatMarketCap = (marketCap?: number) => {
    if (marketCap === undefined || marketCap === null) return 'N/A';
    
    if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
    } else if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  // Format percent change
  const formatPercentChange = (percentChange?: number) => {
    if (percentChange === undefined || percentChange === null) return 'N/A';
    
    const formattedValue = percentChange.toFixed(2);
    const isPositive = percentChange > 0;
    
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{formattedValue}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Similar Companies
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Similar Companies
        </h2>
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Similar Companies
        </h2>
        <p className="text-gray-600">
          No similar companies data available for this stock.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Similar Companies & Competitors
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {companies.map((company, index) => (
          <div 
            key={index} 
            className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <Link 
              href={`/stock/${company.ticker}`} 
              className="block"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 text-base truncate" title={company.name || company.ticker}>
                  {company.name || company.ticker}
                </h3>
                <span className="text-sm font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                  {company.ticker}
                </span>
              </div>
              
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Market Cap:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {formatMarketCap(company.market_cap)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Price:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {formatCurrency(company.price)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">7-Day Change:</span>
                  <span className="text-xs font-medium">
                    {formatPercentChange(company.percentChange)}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Data shows companies related to {ticker} based on industry classification, market behavior, and news correlation.
        </p>
      </div>
    </div>
  );
} 