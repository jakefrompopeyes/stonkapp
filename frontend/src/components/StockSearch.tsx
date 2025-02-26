'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchStocks, StockSearchResult } from '@/lib/stockApi';

interface StockSearchProps {
  onSelectStock?: (stock: StockSearchResult) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSelectStock }) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle outside click to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    
    setLoading(true);
    try {
      const data = await searchStocks(query);
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (stock: StockSearchResult) => {
    setQuery(stock.ticker);
    setShowResults(false);
    
    if (onSelectStock) {
      onSelectStock(stock);
    } else {
      router.push(`/stock/${stock.ticker}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for stocks (e.g., AAPL, MSFT, TSLA)"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 
                      dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {results.map((stock) => (
              <li 
                key={stock.ticker} 
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectStock(stock)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{stock.ticker}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{stock.market}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 
                      dark:border-gray-700 rounded-md shadow-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 