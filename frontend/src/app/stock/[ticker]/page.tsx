'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getStockDetails, getStockNews, getStockPrices, StockDetails, NewsItem, PriceData } from '@/lib/stockApi';
import StockSearch from '@/components/StockSearch';
import StockPriceChart from '@/components/StockPriceChart';
import FinancialDataComponent from '@/components/FinancialData';
import InsiderTrading from '@/components/InsiderTrading';
import RelatedCompanies from '@/components/RelatedCompanies';
import ValuationStats from '@/components/ValuationStats';
import ValuationMetricsVisualized from '@/components/ValuationMetricsVisualized';
import ViewLimitPopup from '@/components/ViewLimitPopup';
import { useAuth } from '@/lib/AuthContext';
import { checkViewLimit } from '@/lib/viewLimits';
import ViewCounter from '@/components/ViewCounter';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StockDetailPage() {
  const { ticker } = useParams();
  const { user } = useAuth();
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [latestPrice, setLatestPrice] = useState<PriceData | null>(null);
  const [priceChange, setPriceChange] = useState<{ amount: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1D');
  const [showViewLimitPopup, setShowViewLimitPopup] = useState<boolean>(false);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string>('');

  // Add a direct test function to verify Supabase permissions
  const testSupabaseInsert = async () => {
    if (!user) {
      setTestResult('No user logged in');
      return;
    }
    
    try {
      console.log('Testing direct Supabase insert...');
      const now = new Date().toISOString();
      const testTicker = 'TEST' + Math.floor(Math.random() * 1000);
      
      const { data, error } = await supabase
        .from('user_stock_views')
        .insert({
          user_id: user.id,
          ticker: testTicker,
          viewed_at: now,
          last_reset_at: now
        });
      
      if (error) {
        console.error('Test insert error:', error);
        setTestResult(`Error: ${error.message}`);
      } else {
        console.log('Test insert successful:', data);
        setTestResult(`Success! Inserted test ticker: ${testTicker}`);
        
        // Now try to read it back
        const { data: readData, error: readError } = await supabase
          .from('user_stock_views')
          .select('*')
          .eq('user_id', user.id);
        
        if (readError) {
          console.error('Test read error:', readError);
          setTestResult(prev => `${prev}\nRead Error: ${readError.message}`);
        } else {
          console.log('Test read successful:', readData);
          setTestResult(prev => `${prev}\nRead Success! Found ${readData.length} records`);
        }
      }
    } catch (e) {
      console.error('Test exception:', e);
      setTestResult(`Exception: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  useEffect(() => {
    const fetchStockData = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Check if user has reached view limit
        console.log(`Checking view limit for ticker: ${ticker}, user: ${user?.id || 'anonymous'}`);
        const viewLimitReached = await checkViewLimit(user?.id || null, ticker as string);
        console.log(`View limit reached: ${viewLimitReached}`);
        setLimitReached(viewLimitReached);
        
        if (viewLimitReached) {
          console.log('View limit reached, showing popup and stopping data fetch');
          setShowViewLimitPopup(true);
          setLoading(false);
          return; // Don't load stock data if limit reached
        }
        
        // Get current date and 7 days ago for price data
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 7);
        
        const from = fromDate.toISOString().split('T')[0];
        const to = toDate.toISOString().split('T')[0];
        
        // Fetch stock details, news, and recent price data in parallel
        const [details, news, prices] = await Promise.all([
          getStockDetails(ticker as string),
          getStockNews(ticker as string, 3),
          getStockPrices(ticker as string, from, to)
        ]);
        
        setStockDetails(details);
        setNewsItems(news);
        
        // Set the latest price (last item in the array)
        if (prices && prices.length > 0) {
          setLatestPrice(prices[prices.length - 1]);
          
          // Calculate price change if we have at least 2 data points
          if (prices.length >= 2) {
            const firstPrice = prices[0].c;
            const lastPrice = prices[prices.length - 1].c;
            const changeAmount = lastPrice - firstPrice;
            const changePercentage = (changeAmount / firstPrice) * 100;
            
            setPriceChange({
              amount: changeAmount,
              percentage: changePercentage
            });
          }
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
  }, [ticker, user]);

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format large numbers with abbreviations (K, M, B, T)
  const formatLargeNumber = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    
    return value.toString();
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-6 flex justify-between items-center">
        <StockSearch />
        <ViewCounter />
      </div>
      
      {/* Add test button for debugging */}
      {user && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <button 
            onClick={testSupabaseInsert}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Supabase Insert
          </button>
          {testResult && (
            <pre className="mt-2 p-2 bg-gray-200 rounded text-xs overflow-auto">
              {testResult}
            </pre>
          )}
        </div>
      )}
      
      {limitReached ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center py-8">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-800">View Limit Reached</h2>
            <p className="mt-2 text-gray-600">
              {user ? 
                `You've used all your free stock views for this month.` : 
                `You've used all your anonymous stock views.`}
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              {user ? (
                <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                  View Premium Plans
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                    Sign In
                  </Link>
                  <Link href="/pricing" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                    View Premium Plans
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : stockDetails && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                {stockDetails.branding?.logo_url && (
                  <div className="mr-4 w-12 h-12 relative flex-shrink-0">
                    <img
                      src={`${stockDetails.branding.logo_url}?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'Ql8hVHlw80YaHIBMer0QgagV1L11MMUL'}`}
                      alt={`${stockDetails.ticker} logo`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Hide the image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {stockDetails.ticker}
                  </h1>
                  <p className="text-xl text-gray-600">
                    {stockDetails.name}
                  </p>
                </div>
              </div>
              
              {latestPrice && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatCurrency(latestPrice.c)}
                  </div>
                  {priceChange && (
                    <div className={`text-sm ${priceChange.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange.amount >= 0 ? '+' : ''}{priceChange.amount.toFixed(2)} 
                      ({priceChange.amount >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%)
                      <span className="text-xs text-gray-500 ml-1">{selectedPeriod}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Price Chart */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <StockPriceChart 
              ticker={ticker as string} 
              onPeriodChange={(period) => setSelectedPeriod(period)}
              onPriceChange={(change) => setPriceChange(change)}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Company Information
                </h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Market Cap: </span>
                    <span className="font-medium text-gray-800">
                      {formatLargeNumber(stockDetails.market_cap)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employees: </span>
                    <span className="font-medium text-gray-800">
                      {formatLargeNumber(stockDetails.total_employees)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Listed: </span>
                    <span className="font-medium text-gray-800">
                      {formatDate(stockDetails.list_date)}
                    </span>
                  </div>
                  {stockDetails.address && (
                    <div>
                      <span className="text-gray-600">Headquarters: </span>
                      <span className="font-medium text-gray-800">
                        {stockDetails.address.address1 && `${stockDetails.address.address1}, `}
                        {stockDetails.address.city && `${stockDetails.address.city}, `}
                        {stockDetails.address.state && `${stockDetails.address.state} `}
                        {stockDetails.address.postal_code && stockDetails.address.postal_code}
                      </span>
                    </div>
                  )}
                  {stockDetails.homepage_url && (
                    <div>
                      <span className="text-gray-600">Website: </span>
                      <a 
                        href={stockDetails.homepage_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {stockDetails.homepage_url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Description
                </h2>
                <p className="text-gray-600">
                  {stockDetails.description || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Financial Data */}
          <div className="mb-6">
            <FinancialDataComponent ticker={ticker as string} />
          </div>
          
          {/* Valuation Stats */}
          <div className="mb-6">
            <ValuationStats ticker={ticker as string} />
          </div>
          
          {/* Valuation Metrics Visualized */}
          <div className="mb-6">
            <ValuationMetricsVisualized ticker={ticker as string} />
          </div>
          
          {/* Insider Trading */}
          <div className="mb-6">
            <InsiderTrading ticker={ticker as string} />
          </div>
          
          {/* Related Companies */}
          <div className="mb-6">
            <RelatedCompanies ticker={ticker as string} />
          </div>
          
          {/* News Section */}
          {newsItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Latest News
              </h2>
              <div className="space-y-4">
                {newsItems.map((news) => (
                  <div key={news.id} className="border-b border-gray-200 pb-4">
                    <a 
                      href={news.article_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="text-lg font-medium text-blue-600 hover:underline">
                        {news.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span>{news.publisher?.name || 'Unknown Source'}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(news.published_utc)}</span>
                      </div>
                      <p className="text-gray-600 mt-2">
                        {news.description}
                      </p>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      <ViewLimitPopup 
        isOpen={showViewLimitPopup} 
        onClose={() => setShowViewLimitPopup(false)} 
      />
    </div>
  );
} 