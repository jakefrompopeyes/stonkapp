import api, { mockStockSearch } from './api';
import { fetchInsiderTrading } from './supabaseUtils';

export interface StockSearchResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi: string;
  share_class_figi: string;
  last_updated_utc: string;
}

export interface StockDetails {
  ticker: string;
  name: string;
  description: string;
  homepage_url: string;
  total_employees: number;
  list_date: string;
  market_cap: number;
  phone_number: string;
  address: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  sic_code: string;
  sic_description: string;
  ticker_root: string;
  type: string;
  weighted_shares_outstanding: number;
  market: string;
}

export interface PriceData {
  c: number; // close price
  h: number; // high price
  l: number; // low price
  n: number; // number of transactions
  o: number; // open price
  t: number; // timestamp
  v: number; // trading volume
  vw: number; // volume weighted average price
}

export interface NewsItem {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  amp_url: string;
  image_url: string;
  description: string;
}

export interface FinancialDataPoint {
  label: string;
  order: number;
  unit: string;
  value: number;
}

export interface FinancialData {
  ticker: string;
  period_of_report_date: string;
  fiscal_period: string;
  fiscal_year: string;
  financials: {
    income_statement?: {
      revenues?: FinancialDataPoint;
      net_income_loss?: FinancialDataPoint;
      basic_earnings_per_share?: FinancialDataPoint;
      diluted_earnings_per_share?: FinancialDataPoint;
      operating_income_loss?: FinancialDataPoint;
      cost_of_revenue?: FinancialDataPoint;
      gross_profit?: FinancialDataPoint;
    };
    balance_sheet?: {
      assets?: FinancialDataPoint;
      current_assets?: FinancialDataPoint;
      liabilities?: FinancialDataPoint;
      current_liabilities?: FinancialDataPoint;
      equity?: FinancialDataPoint;
    };
    cash_flow_statement?: {
      net_cash_flow_from_operating_activities?: FinancialDataPoint;
      net_cash_flow_from_investing_activities?: FinancialDataPoint;
      net_cash_flow_from_financing_activities?: FinancialDataPoint;
    };
  };
}

export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
  isDerivative?: boolean;
  id?: string;
  currency?: string;
  source?: string;
  symbol?: string;
}

export interface InsiderSentiment {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
}

/**
 * Search for stocks by ticker or name
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  try {
    // Use the mock implementation instead of the API call
    const response = await mockStockSearch(query);
    return response.data.results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific stock
 */
export const getStockDetails = async (ticker: string): Promise<StockDetails> => {
  try {
    const response = await api.get(`/api/stocks/details/${ticker}`);
    return response.data.details;
  } catch (error) {
    console.error(`Error fetching details for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get price data for a stock
 */
export const getStockPrices = async (
  ticker: string, 
  from?: string, 
  to?: string,
  timespan?: string,
  multiplier?: number
): Promise<PriceData[]> => {
  try {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (timespan) params.timespan = timespan;
    if (multiplier) params.multiplier = multiplier.toString();
    
    const response = await api.get(`/api/stocks/prices/${ticker}`, { params });
    return response.data.prices;
  } catch (error) {
    console.error(`Error fetching prices for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get news for a stock
 */
export const getStockNews = async (ticker: string, limit = 5): Promise<NewsItem[]> => {
  try {
    const response = await api.get(`/api/stocks/news/${ticker}`, {
      params: { limit }
    });
    return response.data.news;
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get financial data for a stock
 */
export const getFinancialData = async (ticker: string): Promise<FinancialData[]> => {
  try {
    const response = await api.get(`/api/stocks/financials/${ticker}`);
    return response.data.financials;
  } catch (error) {
    console.error(`Error fetching financials for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get insider transactions for a stock
 */
export const getInsiderTransactions = async (ticker: string): Promise<InsiderTransaction[]> => {
  try {
    // Try to get data from Supabase first
    try {
      const supabaseData = await fetchInsiderTrading(ticker);
      if (supabaseData && supabaseData.length > 0) {
        console.log('Using insider trading data from Supabase');
        return supabaseData;
      }
    } catch (supabaseError) {
      console.warn('Error fetching from Supabase, falling back to API:', supabaseError);
    }
    
    // Fall back to API if Supabase data is not available
    const response = await api.get(`/api/stocks/insider-transactions/${ticker}`);
    return response.data.transactions.data || [];
  } catch (error) {
    console.error(`Error fetching insider transactions for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get insider sentiment for a stock
 */
export const getInsiderSentiment = async (ticker: string): Promise<InsiderSentiment[]> => {
  try {
    const response = await api.get(`/api/stocks/insider-sentiment/${ticker}`);
    return response.data.sentiment.data || [];
  } catch (error) {
    console.error(`Error fetching insider sentiment for ${ticker}:`, error);
    throw error;
  }
}; 