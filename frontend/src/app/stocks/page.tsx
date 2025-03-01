'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import StockSearch from '@/components/StockSearch';
import Link from 'next/link';
import { StockSearchResult } from '@/lib/stockApi';

interface WatchlistItem {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  logo_url?: string;
  created_at: string;
  viewed_at: string;
}

export default function StocksPage() {
  const { user, isLoading } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's watchlist
  useEffect(() => {
    if (!user) {
      setIsWatchlistLoading(false);
      return;
    }

    const fetchWatchlist = async () => {
      try {
        setIsWatchlistLoading(true);
        const { data, error } = await supabase
          .from('user_stock_views')
          .select('*')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false });

        if (error) throw error;
        setWatchlist(data || []);
      } catch (err: any) {
        console.error('Error fetching watchlist:', err);
        setError('Failed to load your watchlist. Please try again later.');
      } finally {
        setIsWatchlistLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  const addToWatchlist = async (stock: StockSearchResult) => {
    if (!user) {
      setError('Please sign in to add stocks to your watchlist');
      return;
    }

    try {
      // Check if stock is already in watchlist
      const exists = watchlist.some(item => item.ticker === stock.ticker);
      if (exists) {
        // Update the viewed_at timestamp
        const { error } = await supabase
          .from('user_stock_views')
          .update({ viewed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('ticker', stock.ticker);

        if (error) throw error;
      } else {
        // Add new stock to watchlist
        const { error } = await supabase
          .from('user_stock_views')
          .insert({
            user_id: user.id,
            ticker: stock.ticker,
            name: stock.name,
            logo_url: stock.logo_url || stock.icon_url
          });

        if (error) throw error;
      }

      // Refresh watchlist
      const { data, error } = await supabase
        .from('user_stock_views')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (err: any) {
      console.error('Error updating watchlist:', err);
      setError('Failed to update your watchlist. Please try again later.');
    }
  };

  const removeFromWatchlist = async (ticker: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_stock_views')
        .delete()
        .eq('user_id', user.id)
        .eq('ticker', ticker);

      if (error) throw error;

      // Update local state
      setWatchlist(watchlist.filter(item => item.ticker !== ticker));
    } catch (err: any) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove stock from your watchlist. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Stock Watchlist</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search for Stocks</h2>
        <StockSearch onSelectStock={addToWatchlist} />
        <p className="mt-2 text-sm text-gray-600">
          Search for a stock and click on it to add to your watchlist
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Watchlist</h2>
        
        {isLoading || isWatchlistLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : !user ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Please <Link href="/auth/signin" className="underline font-semibold">sign in</Link> to view and manage your watchlist.
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded text-center">
            <p className="mb-4">Your watchlist is empty</p>
            <p className="text-sm">Use the search box above to find and add stocks to your watchlist</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Viewed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {watchlist.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/stock/${stock.ticker}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {stock.ticker}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {stock.logo_url && (
                          <img 
                            src={stock.logo_url} 
                            alt={`${stock.ticker} logo`}
                            className="w-6 h-6 mr-2 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{stock.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(stock.viewed_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFromWatchlist(stock.ticker)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 