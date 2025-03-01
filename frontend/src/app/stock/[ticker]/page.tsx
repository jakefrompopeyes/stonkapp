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
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

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

  // Check if stock is in user's favorites
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!user || !ticker) return;
      
      try {
        const { data, error } = await supabase
          .from('user_stock_views')
          .select('is_favorite')
          .eq('user_id', user.id)
          .eq('ticker', ticker as string)
          .single();
        
        if (error) {
          console.error('Error checking favorite status:', error);
          return;
        }
        
        setIsFavorite(data?.is_favorite || false);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };
    
    checkIfFavorite();
  }, [user, ticker]);

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!user || !ticker) {
      setError('Please sign in to add stocks to your favorites');
      return;
    }
    
    setFavoriteLoading(true);
    
    try {
      // Check if stock exists in user_stock_views
      const { data: existingData, error: existingError } = await supabase
        .from('user_stock_views')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticker', ticker as string)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw existingError;
      }
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('user_stock_views')
          .update({ 
            is_favorite: !isFavorite,
            viewed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('ticker', ticker as string);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_stock_views')
          .insert({
            user_id: user.id,
            ticker: ticker as string,
            name: stockDetails?.name || '',
            logo_url: stockDetails?.branding?.logo_url || null,
            is_favorite: true,
            viewed_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      // Update local state
      setIsFavorite(!isFavorite);
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status. Please try again later.');
    } finally {
      setFavoriteLoading(false);
    }
  };

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

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setCommentError('Please sign in to share a comment');
      return;
    }
    
    if (!comment.trim()) {
      setCommentError('Please enter a comment');
      return;
    }
    
    setCommentSubmitting(true);
    setCommentError(null);
    
    try {
      const { error } = await supabase
        .from('stock_comments')
        .insert({
          user_id: user.id,
          ticker: ticker as string,
          comment: comment.trim(),
          stock_name: stockDetails?.name || ''
        });
      
      if (error) throw error;
      
      // Clear form and close modal on success
      setComment('');
      setShowCommentModal(false);
      
      // Show success message (you could add a toast notification here)
      console.log('Comment shared successfully');
    } catch (err: any) {
      console.error('Error sharing comment:', err);
      setCommentError('Failed to share your comment. Please try again later.');
    } finally {
      setCommentSubmitting(false);
    }
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
                  <h1 className="text-2xl font-bold">{stockDetails.name} ({stockDetails.ticker})</h1>
                  <p className="text-gray-600">{stockDetails.market} · {stockDetails.locale}</p>
                </div>
              </div>
              
              {user && (
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                    favoriteLoading ? 'bg-gray-200 cursor-not-allowed' : 
                    isFavorite ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {favoriteLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                  ) : (
                    <svg 
                      className={`h-6 w-6 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      fill={isFavorite ? "currentColor" : "none"}
                      strokeWidth={isFavorite ? "0" : "2"}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                      />
                    </svg>
                  )}
                </button>
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
      
      {/* Comment Button - Fixed in bottom right corner */}
      <div className="fixed bottom-6 right-6 z-10">
        <button
          onClick={() => setShowCommentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center transition-all"
          title="Share a comment"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
        </button>
      </div>
      
      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Share a Comment on {ticker}
              </h3>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {!user && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                Please <Link href="/auth/signin" className="underline font-semibold">sign in</Link> to share a comment.
              </div>
            )}
            
            {commentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {commentError}
              </div>
            )}
            
            <form onSubmit={handleCommentSubmit}>
              <div className="mb-4">
                <label htmlFor="comment" className="block text-gray-700 text-sm font-medium mb-2">
                  Your comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Share your thoughts on this stock..."
                  disabled={!user || commentSubmitting}
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={commentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  disabled={!user || commentSubmitting}
                >
                  {commentSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    'Share Comment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ViewLimitPopup 
        isOpen={showViewLimitPopup} 
        onClose={() => setShowViewLimitPopup(false)} 
      />
    </div>
  );
} 