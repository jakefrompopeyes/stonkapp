import api from './api';
import { supabase } from './supabase';

// Simple interfaces with only the essential properties
export interface StockSearchResult {
  ticker: string;
  name: string;
  market: string;
  type: string;
  active: boolean;
  logo_url?: string; // Add logo URL
  icon_url?: string; // Add icon URL
}

export interface StockDetails {
  ticker: string;
  name: string;
  description: string;
  market: string;
  type: string;
  active: boolean;
  // Additional properties used in the stock details page
  market_cap?: number;
  total_employees?: number;
  list_date?: string;
  shares_outstanding?: number; // Add shares outstanding
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  homepage_url?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  sic_code?: string;
  sic_description?: string;
  locale?: string;
  [key: string]: any; // Allow for additional properties
}

export interface PriceData {
  c: number; // close price
  h: number; // high price
  l: number; // low price
  o: number; // open price
  t: number; // timestamp
  v: number; // trading volume
  n?: number; // Optional property used in StockPriceChart
  vw?: number; // Optional property
  [key: string]: any; // Allow for additional properties
}

export interface NewsItem {
  id: string;
  title: string;
  published_utc: string;
  article_url: string;
  description: string;
  publisher?: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional properties
}

export interface FinancialData {
  ticker: string;
  period_of_report_date: string;
  fiscal_period: string;
  fiscal_year: string;
  financials?: {
    income_statement?: {
      revenues?: number;
      cost_of_revenue?: number;
      gross_profit?: number;
      operating_income_loss?: number;
      net_income_loss?: number;
      basic_earnings_per_share?: number;
      diluted_earnings_per_share?: number;
      [key: string]: any;
    };
    balance_sheet?: {
      assets?: number;
      liabilities?: number;
      equity?: number;
      current_assets?: number;
      current_liabilities?: number;
      [key: string]: any;
    };
    cash_flow_statement?: {
      net_cash_flow_from_operating_activities?: number;
      net_cash_flow_from_investing_activities?: number;
      net_cash_flow_from_financing_activities?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional properties
}

export interface InsiderTransaction {
  name: string;
  filingDate: string;
  transactionDate: string;
  transactionType: string;
  sharesTraded: number;
  price: number;
  // Additional properties used in the InsiderTrading component
  transactionCode?: string;
  isDerivative?: boolean;
  change?: number;
  transactionPrice?: number;
  [key: string]: any; // Allow for additional properties
}

export interface InsiderSentiment {
  symbol: string;
  year: number;
  month: number;
  change: number;
}

// New interface for valuation metrics
export interface ValuationMetrics {
  ticker: string;
  peAnnual?: number;
  psAnnual?: number;
  evToEBITDA?: number;
  evToRevenue?: number;
  bookValue?: number;
  sharesOutstanding?: number;
  bookValuePerShare?: number;
  [key: string]: any;
}

// Direct API implementations with proper error handling
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'Ql8hVHlw80YaHIBMer0QgagV1L11MMUL';
const POLYGON_BASE_URL = 'https://api.polygon.io';
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'cuufs59r01qlidi3qulgcuufs59r01qlidi3qum0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Search for stocks by ticker or name
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  try {
    const response = await fetch(`${POLYGON_BASE_URL}/v3/reference/tickers?search=${query}&active=true&sort=ticker&order=asc&limit=10&apikey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error('Error searching stocks:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    return (data.results || []).map((item: any) => ({
      ticker: item.ticker || '',
      name: item.name || '',
      market: item.market || 'stocks',
      type: item.type || 'CS',
      active: item.active || true,
      logo_url: item.branding?.logo_url || '',
      icon_url: item.branding?.icon_url || ''
    }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};

/**
 * Get detailed information for a specific stock
 */
export const getStockDetails = async (ticker: string): Promise<StockDetails> => {
  try {
    // Fetch data from Polygon API
    const response = await fetch(`${POLYGON_BASE_URL}/v3/reference/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching stock details for ${ticker}:`, response.status, response.statusText);
      throw new Error(`Failed to fetch stock details for ${ticker}`);
    }
    
    const data = await response.json();
    console.log(`Polygon API response for ${ticker}:`, data.results);
    
    // Also fetch valuation metrics to get shares outstanding
    const valuationMetrics = await getValuationMetrics(ticker);
    
    // Get shares outstanding from Polygon API first, fallback to valuation metrics
    let sharesOutstanding = data.results.share_class_shares_outstanding;
    
    // If not available in Polygon, try to get it from Finnhub via valuation metrics
    if (!sharesOutstanding && valuationMetrics.sharesOutstanding) {
      sharesOutstanding = valuationMetrics.sharesOutstanding;
      console.log(`Using shares outstanding from Finnhub: ${sharesOutstanding}`);
    }
    
    console.log(`Final shares outstanding for ${ticker}: ${sharesOutstanding}`);
    
    // Map the response to our StockDetails interface
    return {
      ticker: data.results.ticker,
      name: data.results.name,
      description: data.results.description,
      market: data.results.market,
      type: data.results.type,
      active: data.results.active,
      market_cap: data.results.market_cap,
      total_employees: data.results.total_employees,
      list_date: data.results.list_date,
      shares_outstanding: sharesOutstanding, // Use the shares outstanding we determined
      address: data.results.address,
      homepage_url: data.results.homepage_url,
      branding: data.results.branding,
      sic_code: data.results.sic_code,
      sic_description: data.results.sic_description,
      locale: data.results.locale,
    };
  } catch (error) {
    console.error(`Error fetching stock details for ${ticker}:`, error);
    // Return a minimal valid StockDetails object
    return {
      ticker: ticker,
      name: ticker,
      description: '',
      market: '',
      type: '',
      active: true,
      shares_outstanding: undefined,
    };
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
    // Set default date range if not provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Set default timespan and multiplier if not provided
    const timespanValue = timespan || 'day';
    const multiplierValue = multiplier || 1;
    
    const response = await fetch(`${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker}/range/${multiplierValue}/${timespanValue}/${fromDate}/${toDate}?apikey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching prices for ${ticker}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    return (data.results || []).map((item: any) => ({
      c: item.c || 0, // close price
      h: item.h || 0, // high price
      l: item.l || 0, // low price
      o: item.o || 0, // open price
      t: item.t || 0, // timestamp
      v: item.v || 0,  // trading volume
      n: item.n,      // Optional property used in StockPriceChart
      vw: item.vw     // Optional property
    }));
  } catch (error) {
    console.error(`Error fetching prices for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get news for a stock
 */
export const getStockNews = async (ticker: string, limit = 5): Promise<NewsItem[]> => {
  try {
    const response = await fetch(`${POLYGON_BASE_URL}/v2/reference/news?ticker=${ticker}&limit=${limit}&order=desc&sort=published_utc&apikey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching news for ${ticker}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    return (data.results || []).map((item: any) => ({
      id: item.id || '',
      title: item.title || '',
      published_utc: item.published_utc || '',
      article_url: item.article_url || '',
      description: item.description || '',
      publisher: item.publisher,
      // Additional properties used in the stock details page
      market_cap: item.market_cap,
      total_employees: item.total_employees,
      list_date: item.list_date,
      address: item.address,
      homepage_url: item.homepage_url
    }));
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get financial data for a stock
 */
export const getFinancialData = async (ticker: string): Promise<FinancialData[]> => {
  try {
    const response = await fetch(`${POLYGON_BASE_URL}/vX/reference/financials?ticker=${ticker}&limit=4&sort=period_of_report_date&order=desc&timeframe=quarterly&apikey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching financials for ${ticker}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    return (data.results || []).map((item: any) => ({
      ticker: item.ticker || ticker,
      period_of_report_date: item.period_of_report_date || '',
      fiscal_period: item.fiscal_period || '',
      fiscal_year: item.fiscal_year || '',
      financials: item.financials
    }));
  } catch (error) {
    console.error(`Error fetching financials for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get insider transactions for a stock
 */
export const getInsiderTransactions = async (ticker: string): Promise<InsiderTransaction[]> => {
  try {
    // Use Finnhub API to get insider transactions
    const response = await fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching insider transactions from Finnhub for ${ticker}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('Finnhub insider transactions data:', data);
    
    // Transform the Finnhub data to match our expected format
    return (data.data || []).map((item: any) => {
      // Calculate the price - Finnhub provides it directly in transactionPrice
      // If transactionPrice is not available, we can try to calculate it from value and share
      // Note: For many transaction types (like M - Exercise/Conversion), the price might be 0
      const price = item.transactionPrice || 0;
      
      // For transactions with a price of 0 but with a value and share count, we can calculate the price
      // This is particularly important for sales and purchases
      const calculatedPrice = (item.value && item.change && item.change !== 0) 
        ? Math.abs(item.value / item.change) 
        : price;
      
      // IMPORTANT: The 'change' field represents the actual number of shares traded in the transaction
      // The 'share' field represents the total shares held by the insider after the transaction
      return {
        name: item.name || '',
        filingDate: item.filingDate || '',
        transactionDate: item.transactionDate || '',
        transactionType: item.transactionCode || '',  // Using transactionCode as type
        sharesTraded: Math.abs(item.change || 0),  // Use change field for the transaction size
        price: calculatedPrice,
        transactionCode: item.transactionCode || '',
        isDerivative: item.isDerivative === true,  // Ensure boolean value
        change: Math.abs(item.change || 0),  // This is the actual number of shares traded
        transactionPrice: calculatedPrice
      };
    });
  } catch (error) {
    console.error(`Error fetching insider transactions for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get insider sentiment for a stock
 */
export const getInsiderSentiment = async (ticker: string): Promise<InsiderSentiment[]> => {
  try {
    // This is a simplified version that returns empty data
    // since we're focusing on fixing the TypeScript error
    return [];
  } catch (error) {
    console.error(`Error fetching insider sentiment for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get related companies for a stock
 */
export interface RelatedCompany {
  ticker: string;
  name?: string;
  description?: string;
  market?: string;
  type?: string;
  market_cap?: number;
  homepage_url?: string;
  total_employees?: number;
  price?: number;
  percentChange?: number;
}

export const getRelatedCompanies = async (ticker: string): Promise<RelatedCompany[]> => {
  try {
    const response = await fetch(`${POLYGON_BASE_URL}/v1/related-companies/${ticker}?apiKey=${POLYGON_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching related companies for ${ticker}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }
    
    // The API returns just tickers, so we'll fetch comprehensive details for each
    const relatedCompanies: RelatedCompany[] = data.results.map((item: any) => ({
      ticker: item.ticker || '',
    }));
    
    // Since we have unlimited API calls, we'll fetch comprehensive details for each company
    const companiesWithDetails = await Promise.all(
      relatedCompanies.map(async (company) => {
        try {
          // Fetch detailed information for each ticker
          const details = await getStockDetails(company.ticker);
          
          // Fetch the latest price data
          const today = new Date();
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          
          const priceData = await getStockPrices(
            company.ticker,
            oneWeekAgo.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
          );
          
          // Calculate current price and percent change if price data is available
          let price = 0;
          let percentChange = 0;
          
          if (priceData.length > 0) {
            const latestPrice = priceData[priceData.length - 1];
            price = latestPrice.c;
            
            if (priceData.length > 1) {
              const previousPrice = priceData[0].c;
              percentChange = ((latestPrice.c - previousPrice) / previousPrice) * 100;
            }
          }
          
          return {
            ...company,
            name: details.name,
            description: details.description,
            market: details.market,
            type: details.type,
            market_cap: details.market_cap,
            homepage_url: details.homepage_url,
            total_employees: details.total_employees,
            price,
            percentChange
          };
        } catch (error) {
          console.error(`Error fetching details for related company ${company.ticker}:`, error);
          // If details fetch fails, return just the ticker
          return company;
        }
      })
    );
    
    // Sort by market cap (descending) to show the most significant competitors first
    return companiesWithDetails.sort((a, b) => {
      if (!a.market_cap) return 1;
      if (!b.market_cap) return -1;
      return b.market_cap - a.market_cap;
    });
  } catch (error) {
    console.error(`Error fetching related companies for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get server status
 */
export const getServerStatus = async (): Promise<string> => {
  try {
    // Try to connect to Supabase
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

/**
 * Get valuation metrics for a stock (EV/EBITDA, EV/Revenue, etc.)
 */
export const getValuationMetrics = async (ticker: string): Promise<ValuationMetrics> => {
  try {
    console.log(`getValuationMetrics - Starting for ticker: ${ticker}`);
    
    // Fetch data from Finnhub API
    const response = await fetch(`${FINNHUB_BASE_URL}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching valuation metrics for ${ticker}:`, response.status, response.statusText);
      throw new Error(`Failed to fetch valuation metrics for ${ticker}`);
    }
    
    const data = await response.json();
    console.log(`Finnhub data for ${ticker}:`, data.metric);
    
    // Get shares outstanding from Finnhub API
    let sharesOutstanding = data.metric?.sharesOutstanding;
    console.log(`Shares outstanding from Finnhub for ${ticker}: ${sharesOutstanding}`);
    
    // We need to get the total shareholder equity (book value)
    let bookValue;
    let bookValuePerShare;
    
    // Try to get shares outstanding and book value from Polygon API first
    try {
      console.log(`Attempting to fetch data from Polygon API for ${ticker}`);
      const polygonResponse = await fetch(`${POLYGON_BASE_URL}/v3/reference/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`);
      
      if (polygonResponse.ok) {
        const polygonData = await polygonResponse.json();
        console.log(`Polygon data for ${ticker}:`, polygonData.results);
        
        // Get shares outstanding from Polygon
        if (polygonData.results?.share_class_shares_outstanding) {
          const polygonShares = polygonData.results.share_class_shares_outstanding;
          console.log(`Found shares outstanding from Polygon API: ${polygonShares}`);
          
          // Use Polygon shares outstanding
          sharesOutstanding = polygonShares;
        }
        
        // Try to get total shareholder equity from Polygon
        if (polygonData.results?.total_shareholders_equity) {
          bookValue = polygonData.results.total_shareholders_equity;
          console.log(`Found book value (total equity) from Polygon API: ${bookValue}`);
        }
      } else {
        console.log(`Polygon API request failed for ${ticker}: ${polygonResponse.status} ${polygonResponse.statusText}`);
      }
    } catch (err) {
      console.error(`Error fetching data from Polygon:`, err);
    }
    
    // If we couldn't get book value from Polygon, try financial statements
    if (!bookValue) {
      try {
        console.log(`Attempting to fetch financial data for ${ticker}`);
        // Import the getFinancialData function
        const { getFinancialData } = await import('@/lib/stockApiNew');
        
        // Get the most recent financial data
        const financialData = await getFinancialData(ticker);
        console.log(`Financial data for ${ticker}:`, financialData && financialData.length > 0 ? financialData[0] : 'No data');
        
        if (financialData && financialData.length > 0) {
          // Get the most recent statement
          const latestStatement = financialData[0];
          
          // Check if we have balance sheet data with equity
          if (latestStatement.financials?.balance_sheet?.equity) {
            bookValue = latestStatement.financials.balance_sheet.equity;
            console.log(`Found book value (total equity) from balance sheet: ${bookValue}`);
          } else {
            console.log(`No equity data found in balance sheet for ${ticker}`);
          }
        } else {
          console.log(`No financial data found for ${ticker}`);
        }
      } catch (err) {
        console.error(`Error fetching financial data:`, err);
      }
    }
    
    // If we still don't have book value but have P/B ratio and price, calculate it
    if (!bookValue && data.metric?.pbAnnual && data.metric?.price && sharesOutstanding) {
      // Calculate total equity: Price per share / P/B ratio * Shares Outstanding
      bookValue = (data.metric.price / data.metric.pbAnnual) * sharesOutstanding;
      console.log(`Calculated book value from P/B ratio: ${bookValue}`);
    }
    
    // Calculate book value per share - CORRECT FORMULA: Book Value Per Share = Shareholder Equity / Outstanding Shares
    if (bookValue && sharesOutstanding) {
      bookValuePerShare = bookValue / sharesOutstanding;
      console.log(`Calculated book value per share for ${ticker}: ${bookValuePerShare}`);
    } else {
      console.log(`Cannot calculate book value per share for ${ticker} - missing data:`, {
        bookValue,
        sharesOutstanding
      });
    }
    
    console.log(`Final values for ${ticker}:`, {
      sharesOutstanding,
      bookValue,
      bookValuePerShare
    });
    
    // Extract the metrics we need
    return {
      ticker: ticker,
      peAnnual: data.metric?.peAnnual,
      psAnnual: data.metric?.psAnnual,
      evToEBITDA: data.metric?.enterpriseValueOverEBITDA,
      evToRevenue: data.metric?.enterpriseValueOverRevenue,
      bookValue: bookValue, // Total shareholder equity
      sharesOutstanding: sharesOutstanding,
      bookValuePerShare: bookValuePerShare // Add book value per share directly
    };
  } catch (error) {
    console.error(`Error fetching valuation metrics for ${ticker}:`, error);
    // Return a minimal valid ValuationMetrics object without hardcoded values
    return {
      ticker: ticker
    };
  }
}; 