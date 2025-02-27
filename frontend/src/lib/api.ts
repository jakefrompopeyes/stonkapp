import axios from 'axios';
import { supabase } from './supabase';

// Polygon.io API configuration
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
const POLYGON_BASE_URL = 'https://api.polygon.io';

// Debug: Log API key status (not the actual key for security)
console.log('Polygon API Key Status:', POLYGON_API_KEY ? 'Present (length: ' + POLYGON_API_KEY.length + ')' : 'Missing');

// Create Polygon API client with correct authentication
const polygonApi = axios.create({
  baseURL: POLYGON_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add the API key to every request
polygonApi.interceptors.request.use(request => {
  // Add the API key as a query parameter to every request
  request.params = {
    ...request.params,
    apikey: POLYGON_API_KEY  // Changed from apiKey to apikey (lowercase)
  };
  
  // More detailed logging
  console.log('Polygon API Request:', request.method, request.url);
  console.log('Request params:', request.params);
  console.log('API Key Present:', !!POLYGON_API_KEY, 'Length:', POLYGON_API_KEY?.length || 0);
  
  return request;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to log errors
polygonApi.interceptors.response.use(response => {
  // Log successful responses
  console.log('Polygon API Response Status:', response.status);
  console.log('Response data preview:', 
    response.data && typeof response.data === 'object' 
      ? `Results: ${response.data.results?.length || 0} items` 
      : 'No data');
  return response;
}, error => {
  // Enhanced error logging
  console.error('Polygon API Error:');
  console.error('- Status:', error.response?.status);
  console.error('- Status Text:', error.response?.statusText);
  console.error('- URL:', error.config?.url);
  console.error('- Params:', error.config?.params);
  
  if (error.response?.data) {
    console.error('- Error Details:', error.response.data);
  }
  
  if (error.response?.status === 401) {
    console.error('Authentication Error: Please check your API key');
  } else if (error.response?.status === 403) {
    console.error('Authorization Error: Your API key may not have access to this endpoint');
  } else if (error.response?.status === 429) {
    console.error('Rate Limit Error: You have exceeded your API rate limit');
  }
  
  return Promise.reject(error);
});

// We'll keep this for backward compatibility, but we'll primarily use Supabase
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle API calls that would normally go to the backend
api.interceptors.request.use(async (config) => {
  // Check if this is a stock-related request
  if (config.url?.includes('/api/stocks/')) {
    // Cancel the original request
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    source.cancel('Request intercepted for direct Polygon.io implementation');
    
    // We'll handle this in the direct Polygon.io functions
    return config;
  }
  return config;
}, error => Promise.reject(error));

export const getServerStatus = async (): Promise<string> => {
  try {
    // Try to connect to Supabase instead of the backend API
    const { data, error } = await supabase.from('insider_trading').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    return 'Connected to Supabase';
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return 'Error connecting to server';
  }
};

// Direct Polygon.io API implementations

// Search for stocks
export const searchStocks = async (query: string) => {
  try {
    // Log the search query for debugging
    console.log('Searching stocks for:', query);
    
    // Make sure we have an API key
    if (!POLYGON_API_KEY) {
      console.error('Polygon API Key is missing!');
      throw new Error('API key is required for stock search');
    }
    
    const response = await polygonApi.get('/v3/reference/tickers', {
      params: {
        search: query,
        active: true,
        sort: 'ticker',
        order: 'asc',
        limit: 10
        // API key is now added by the interceptor
      }
    });
    
    // Log successful response
    console.log('Search results count:', response.data.results?.length || 0);
    
    // Transform the response to match our expected format
    const results = response.data.results.map((item: any) => ({
      ticker: item.ticker,
      name: item.name,
      market: item.market,
      locale: item.locale,
      primary_exchange: item.primary_exchange,
      type: item.type,
      active: item.active,
      currency_name: item.currency_name,
      cik: item.cik,
      composite_figi: item.composite_figi,
      share_class_figi: item.share_class_figi,
      last_updated_utc: item.last_updated_utc
    }));
    
    return { data: { results } };
  } catch (error) {
    console.error('Error searching stocks with Polygon.io:', error);
    throw error;
  }
};

// Get stock details
export const getStockDetails = async (ticker: string) => {
  try {
    const response = await polygonApi.get(`/v3/reference/tickers/${ticker}`);
    const item = response.data.results;
    
    // Transform the response to match our expected format
    const details = {
      ticker: item.ticker,
      name: item.name,
      description: item.description || `${item.name} (${item.ticker})`,
      homepage_url: item.homepage_url || '',
      total_employees: item.total_employees || 0,
      list_date: item.list_date || '',
      market_cap: item.market_cap || 0,
      phone_number: item.phone_number || '',
      address: {
        address1: item.address?.address1 || '',
        city: item.address?.city || '',
        state: item.address?.state || '',
        postal_code: item.address?.postal_code || '',
      },
      sic_code: item.sic_code || '',
      sic_description: item.sic_description || '',
      ticker_root: item.ticker_root || item.ticker,
      type: item.type || '',
      weighted_shares_outstanding: item.weighted_shares_outstanding || 0,
      market: item.market || 'stocks',
    };
    
    return { data: { details } };
  } catch (error) {
    console.error(`Error fetching details for ${ticker} with Polygon.io:`, error);
    throw error;
  }
};

// Get stock prices
export const getStockPrices = async (
  ticker: string, 
  from?: string, 
  to?: string,
  timespan = 'day',
  multiplier = 1
) => {
  try {
    // Set default date range if not provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await polygonApi.get(`/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${fromDate}/${toDate}`);
    
    // Transform the response to match our expected format
    const prices = response.data.results.map((item: any) => ({
      c: item.c, // close price
      h: item.h, // high price
      l: item.l, // low price
      n: item.n || 0, // number of transactions
      o: item.o, // open price
      t: item.t, // timestamp
      v: item.v, // trading volume
      vw: item.vw || item.c, // volume weighted average price
    }));
    
    return { data: { prices } };
  } catch (error) {
    console.error(`Error fetching prices for ${ticker} with Polygon.io:`, error);
    throw error;
  }
};

// Get stock news
export const getStockNews = async (ticker: string, limit = 5) => {
  try {
    const response = await polygonApi.get('/v2/reference/news', {
      params: {
        ticker,
        limit,
        order: 'desc',
        sort: 'published_utc'
      }
    });
    
    // Transform the response to match our expected format
    const news = response.data.results.map((item: any) => ({
      id: item.id,
      publisher: {
        name: item.publisher.name,
        homepage_url: item.publisher.homepage_url,
        logo_url: item.publisher.logo_url,
        favicon_url: item.publisher.favicon_url,
      },
      title: item.title,
      author: item.author || 'Unknown',
      published_utc: item.published_utc,
      article_url: item.article_url,
      tickers: item.tickers,
      amp_url: item.amp_url || '',
      image_url: item.image_url || '',
      description: item.description || '',
    }));
    
    return { data: { news } };
  } catch (error) {
    console.error(`Error fetching news for ${ticker} with Polygon.io:`, error);
    throw error;
  }
};

// Get financial data
export const getFinancialData = async (ticker: string) => {
  try {
    // Add debugging for financial data request
    console.log('Fetching financial data for:', ticker);
    
    const response = await polygonApi.get(`/vX/reference/financials`, {
      params: {
        ticker,
        limit: 4, // Fetch the last 4 quarters instead of just 1
        sort: 'period_of_report_date',
        order: 'desc',
        timeframe: 'quarterly'
      }
    });
    
    // Log the number of financial periods retrieved
    console.log('Financial periods retrieved:', response.data.results?.length || 0);
    
    return { data: { financials: response.data.results } };
  } catch (error) {
    console.error(`Error fetching financials for ${ticker} with Polygon.io:`, error);
    throw error;
  }
};

// Get insider transactions (using Supabase)
export const getInsiderTransactions = async (ticker: string) => {
  try {
    const { data, error } = await supabase
      .from('insider_trading')
      .select('*')
      .eq('symbol', ticker)
      .order('filingDate', { ascending: false });
    
    if (error) throw error;
    
    return { data: { transactions: { data: data || [] } } };
  } catch (error) {
    console.error(`Error fetching insider transactions for ${ticker}:`, error);
    throw error;
  }
};

// Get insider sentiment
export const getInsiderSentiment = async (ticker: string) => {
  try {
    // This endpoint might not be available in Polygon.io free tier
    // Returning empty data for now
    return { data: { sentiment: { data: [] } } };
  } catch (error) {
    console.error(`Error fetching insider sentiment for ${ticker}:`, error);
    throw error;
  }
};

export default api; 