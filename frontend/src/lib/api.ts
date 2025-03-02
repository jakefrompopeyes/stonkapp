import axios from 'axios';
import { supabase } from './supabase';

// Polygon.io API configuration
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'Ql8hVHlw80YaHIBMer0QgagV1L11MMUL'; // Fallback to the key from .env.local
const POLYGON_BASE_URL = 'https://api.polygon.io';

// Finnhub API configuration
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'sandbox_c7jrj0qad3iefkeapmpg'; // Default to sandbox key if not provided
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Debug: Log API key status (not the actual key for security)
console.log('Polygon API Key Status:', POLYGON_API_KEY ? `Present (length: ${POLYGON_API_KEY.length})` : 'Missing');
console.log('Finnhub API Key Status:', FINNHUB_API_KEY ? `Present (length: ${FINNHUB_API_KEY.length})` : 'Missing');

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

// Create Finnhub API client
const finnhubApi = axios.create({
  baseURL: FINNHUB_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add the API key to every Finnhub request
finnhubApi.interceptors.request.use(request => {
  // Add the API key as a query parameter to every request
  request.params = {
    ...request.params,
    token: FINNHUB_API_KEY
  };
  
  // More detailed logging
  console.log('Finnhub API Request:', request.method, request.url);
  console.log('Request params:', request.params);
  console.log('API Key Present:', !!FINNHUB_API_KEY, 'Length:', FINNHUB_API_KEY?.length || 0);
  
  return request;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to log Finnhub errors
finnhubApi.interceptors.response.use(response => {
  // Log successful responses
  console.log('Finnhub API Response Status:', response.status);
  console.log('Response data preview:', 
    response.data && typeof response.data === 'object' 
      ? (Array.isArray(response.data) ? `Results: ${response.data.length} items` : 'Object data') 
      : 'No data');
  return response;
}, error => {
  // Enhanced error logging
  console.error('Finnhub API Error:');
  console.error('- Status:', error.response?.status);
  console.error('- Status Text:', error.response?.statusText);
  console.error('- URL:', error.config?.url);
  console.error('- Params:', error.config?.params);
  
  if (error.response?.data) {
    console.error('- Error Details:', error.response.data);
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
      // Return empty results instead of throwing an error
      return { data: { results: [] } };
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
    // Return empty results instead of throwing an error
    return { data: { results: [] } };
  }
};

// Get stock details
export const getStockDetails = async (ticker: string) => {
  try {
    // Make sure we have an API key
    if (!POLYGON_API_KEY) {
      console.error('Polygon API Key is missing!');
      throw new Error('API key is required for stock details');
    }
    
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
      active: item.active || true,
    };
    
    return { data: { details } };
  } catch (error) {
    console.error(`Error fetching details for ${ticker} with Polygon.io:`, error);
    // Return a minimal stock details object instead of throwing an error
    return { 
      data: { 
        details: {
          ticker: ticker,
          name: ticker,
          description: `Information for ${ticker} is currently unavailable`,
          homepage_url: '',
          total_employees: 0,
          list_date: '',
          market_cap: 0,
          phone_number: '',
          address: {
            address1: '',
            city: '',
            state: '',
            postal_code: '',
          },
          sic_code: '',
          sic_description: '',
          ticker_root: ticker,
          type: 'CS',
          weighted_shares_outstanding: 0,
          market: 'stocks',
          active: true
        } 
      } 
    };
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
    // Make sure we have an API key
    if (!POLYGON_API_KEY) {
      console.error('Polygon API Key is missing!');
      throw new Error('API key is required for stock prices');
    }
    
    // Set default date range if not provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Log the request parameters
    console.log(`Fetching ${ticker} prices from ${fromDate} to ${toDate} with timespan=${timespan}, multiplier=${multiplier}`);
    
    const response = await polygonApi.get(`/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${fromDate}/${toDate}`);
    
    // Check if we have results
    if (!response.data.results || response.data.results.length < 2) {
      console.warn(`Insufficient price data for ${ticker} with timespan=${timespan}, multiplier=${multiplier}`);
      
      // Special handling for 1D timeframe - try to get hourly data instead of minute data
      if (timespan === 'minute') {
        console.log('Falling back to hourly data for 1D view');
        
        // Calculate a new date range for the last 24 hours
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        const fallbackFrom = startDate.toISOString().split('T')[0];
        const fallbackTo = endDate.toISOString().split('T')[0];
        
        // Try to get hourly data instead
        const hourlyResponse = await polygonApi.get(`/v2/aggs/ticker/${ticker}/range/1/hour/${fallbackFrom}/${fallbackTo}`);
        
        if (hourlyResponse.data.results && hourlyResponse.data.results.length >= 2) {
          console.log(`Successfully retrieved ${hourlyResponse.data.results.length} hourly data points as fallback`);
          
          // Transform the response to match our expected format
          const prices = hourlyResponse.data.results.map((item: any) => ({
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
        }
      }
    }
    
    // If we have results or the fallback didn't work, proceed with the original data
    const prices = (response.data.results || []).map((item: any) => ({
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
    // Return empty prices array instead of throwing an error
    return { data: { prices: [] } };
  }
};

// Get stock news
export const getStockNews = async (ticker: string, limit = 5) => {
  try {
    // Make sure we have an API key
    if (!POLYGON_API_KEY) {
      console.error('Polygon API Key is missing!');
      throw new Error('API key is required for stock news');
    }
    
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
    // Return empty news array instead of throwing an error
    return { data: { news: [] } };
  }
};

// Get financial data
export const getFinancialData = async (ticker: string) => {
  try {
    // Make sure we have an API key
    if (!POLYGON_API_KEY) {
      console.error('Polygon API Key is missing!');
      throw new Error('API key is required for financial data');
    }
    
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
    // Return empty financials array instead of throwing an error
    return { data: { financials: [] } };
  }
};

// Get insider transactions using Finnhub API
export const getInsiderTransactions = async (ticker: string) => {
  try {
    console.log('Fetching insider transactions for:', ticker);
    
    // Try to get data from Supabase first
    try {
      const { data, error } = await supabase
        .from('insider_trading')
        .select('*')
        .eq('symbol', ticker)
        .order('filingDate', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Using insider trading data from Supabase, found:', data.length, 'records');
        return { data: { transactions: { data: data || [] } } };
      } else {
        console.log('No insider trading data found in Supabase, falling back to Finnhub');
      }
    } catch (supabaseError) {
      console.warn('Error fetching from Supabase, falling back to Finnhub:', supabaseError);
    }
    
    // Fall back to Finnhub API
    const response = await finnhubApi.get('/stock/insider-transactions', {
      params: {
        symbol: ticker
      }
    });
    
    // Transform the Finnhub data to match our expected format
    const transformedData = response.data.data?.map((item: any) => ({
      id: item.id || `${item.symbol}-${item.name}-${item.transactionDate}`,
      symbol: item.symbol,
      filingDate: item.filingDate,
      transactionDate: item.transactionDate,
      reportingName: item.name,
      relationshipTitle: item.position || 'Insider',
      transactionType: item.change > 0 ? 'P-Purchase' : 'S-Sale',
      sharesTraded: Math.abs(item.change),
      price: item.transactionPrice || 0,
      sharesOwned: item.share || 0,
      value: Math.abs(item.change * (item.transactionPrice || 0))
    }));
    
    console.log('Finnhub insider transactions found:', transformedData?.length || 0);
    
    return { data: { transactions: { data: transformedData || [] } } };
  } catch (error) {
    console.error(`Error fetching insider transactions for ${ticker}:`, error);
    // Return empty array in case of error
    return { data: { transactions: { data: [] } } };
  }
};

// Get insider sentiment using Finnhub API
export const getInsiderSentiment = async (ticker: string) => {
  try {
    console.log('Fetching insider sentiment for:', ticker);
    
    const response = await finnhubApi.get('/stock/insider-sentiment', {
      params: {
        symbol: ticker,
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
        to: new Date().toISOString().split('T')[0] // today
      }
    });
    
    // Transform the Finnhub data to match our expected format
    const transformedData = response.data.data?.map((item: any) => ({
      symbol: ticker,
      year: parseInt(item.year),
      month: parseInt(item.month),
      change: item.change,
      mspr: item.mspr, // Monthly Share Purchase Ratio
      totalInsiderTrading: item.totalInsiderTrading || 0
    }));
    
    console.log('Finnhub insider sentiment periods found:', transformedData?.length || 0);
    
    return { data: { sentiment: { data: transformedData || [] } } };
  } catch (error) {
    console.error(`Error fetching insider sentiment for ${ticker}:`, error);
    // Return empty array in case of error
    return { data: { sentiment: { data: [] } } };
  }
};

export default api; 