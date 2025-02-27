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
        
        // Limit to top 10 companies for better UI
        const topCompanies = filteredCompanies.slice(0, 10);
        
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

  // Format large numbers with commas
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

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
      <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
        {isPositive ? '+' : ''}{formattedValue}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Similar Companies
        </h2>
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Similar Companies
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No similar companies data available for this stock.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Similar Companies & Competitors
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ticker
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Market Cap
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                7-Day Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {companies.map((company, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <Link href={`/stocks/${company.ticker}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                    {company.name || company.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {company.ticker}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                  {formatMarketCap(company.market_cap)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                  {formatCurrency(company.price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {formatPercentChange(company.percentChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          Data shows companies related to {ticker} based on industry classification, market behavior, and news correlation. Market cap values are sorted from largest to smallest.
        </p>
      </div>
    </div>
  );
} 