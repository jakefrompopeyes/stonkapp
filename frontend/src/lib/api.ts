import axios from 'axios';
import { supabase } from './supabase';

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
  // Check if this is a stock search request
  if (config.url === '/api/stocks/search') {
    // Cancel the original request
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    source.cancel('Request intercepted for mock implementation');
    
    // We'll handle this in the mockStockSearch function
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

// Mock stock search function to replace the API call
export const mockStockSearch = async (query: string) => {
  // Sample stock data
  const stockData = [
    { ticker: 'GME', name: 'GameStop Corp.', market: 'stocks', locale: 'us', primary_exchange: 'NYSE', type: 'CS', active: true, currency_name: 'usd', cik: '0001326380', composite_figi: 'BBG000BB5KF8', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
    { ticker: 'AAPL', name: 'Apple Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0000320193', composite_figi: 'BBG000B9XRY4', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0000789019', composite_figi: 'BBG000BPH459', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0001018724', composite_figi: 'BBG000BVPV84', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
    { ticker: 'TSLA', name: 'Tesla Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0001318605', composite_figi: 'BBG000N9MNX3', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
  ];
  
  // Filter stocks based on query
  const lowercaseQuery = query.toLowerCase();
  const results = stockData.filter(stock => 
    stock.ticker.toLowerCase().includes(lowercaseQuery) || 
    stock.name.toLowerCase().includes(lowercaseQuery)
  );
  
  return { data: { results } };
};

export default api; 