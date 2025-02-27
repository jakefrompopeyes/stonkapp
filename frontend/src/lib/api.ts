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
  // Check if this is a stock-related request
  if (config.url?.includes('/api/stocks/')) {
    // Cancel the original request
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    source.cancel('Request intercepted for mock implementation');
    
    // We'll handle this in the mock functions
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

// Mock stock data
const stockData = [
  { ticker: 'GME', name: 'GameStop Corp.', market: 'stocks', locale: 'us', primary_exchange: 'NYSE', type: 'CS', active: true, currency_name: 'usd', cik: '0001326380', composite_figi: 'BBG000BB5KF8', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
  { ticker: 'AAPL', name: 'Apple Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0000320193', composite_figi: 'BBG000B9XRY4', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0000789019', composite_figi: 'BBG000BPH459', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0001018724', composite_figi: 'BBG000BVPV84', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
  { ticker: 'TSLA', name: 'Tesla Inc.', market: 'stocks', locale: 'us', primary_exchange: 'NASDAQ', type: 'CS', active: true, currency_name: 'usd', cik: '0001318605', composite_figi: 'BBG000N9MNX3', share_class_figi: 'BBG001S5N8V8', last_updated_utc: '2023-03-01' },
];

// Mock stock details
const stockDetails = {
  'AAPL': {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod.',
    homepage_url: 'https://www.apple.com',
    total_employees: 154000,
    list_date: '1980-12-12',
    market_cap: 2800000000000,
    phone_number: '408-996-1010',
    address: {
      address1: 'One Apple Park Way',
      city: 'Cupertino',
      state: 'CA',
      postal_code: '95014',
    },
    sic_code: '3571',
    sic_description: 'Electronic Computers',
    ticker_root: 'AAPL',
    type: 'CS',
    weighted_shares_outstanding: 15500000000,
    market: 'stocks',
  },
  'MSFT': {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.',
    homepage_url: 'https://www.microsoft.com',
    total_employees: 181000,
    list_date: '1986-03-13',
    market_cap: 2300000000000,
    phone_number: '425-882-8080',
    address: {
      address1: 'One Microsoft Way',
      city: 'Redmond',
      state: 'WA',
      postal_code: '98052',
    },
    sic_code: '7372',
    sic_description: 'Prepackaged Software',
    ticker_root: 'MSFT',
    type: 'CS',
    weighted_shares_outstanding: 7420000000,
    market: 'stocks',
  },
  'GME': {
    ticker: 'GME',
    name: 'GameStop Corp.',
    description: 'GameStop Corp., a specialty retailer, provides games and entertainment products through its e-commerce properties and various stores in the United States, Canada, Australia, and Europe. The company sells new and pre-owned gaming platforms; accessories, such as controllers, gaming headsets, virtual reality products, and memory cards.',
    homepage_url: 'https://www.gamestop.com',
    total_employees: 12000,
    list_date: '2002-02-13',
    market_cap: 4500000000,
    phone_number: '817-424-2000',
    address: {
      address1: '625 Westport Parkway',
      city: 'Grapevine',
      state: 'TX',
      postal_code: '76051',
    },
    sic_code: '5734',
    sic_description: 'Computer and Software Stores',
    ticker_root: 'GME',
    type: 'CS',
    weighted_shares_outstanding: 304000000,
    market: 'stocks',
  },
  'AMZN': {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS).',
    homepage_url: 'https://www.amazon.com',
    total_employees: 1540000,
    list_date: '1997-05-15',
    market_cap: 1700000000000,
    phone_number: '206-266-1000',
    address: {
      address1: '410 Terry Avenue North',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98109',
    },
    sic_code: '5961',
    sic_description: 'Retail-Catalog & Mail-Order Houses',
    ticker_root: 'AMZN',
    type: 'CS',
    weighted_shares_outstanding: 10300000000,
    market: 'stocks',
  },
  'TSLA': {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally. The company operates in two segments, Automotive, and Energy Generation and Storage.',
    homepage_url: 'https://www.tesla.com',
    total_employees: 127855,
    list_date: '2010-06-29',
    market_cap: 600000000000,
    phone_number: '650-681-5000',
    address: {
      address1: '1 Tesla Road',
      city: 'Austin',
      state: 'TX',
      postal_code: '78725',
    },
    sic_code: '3711',
    sic_description: 'Motor Vehicles & Passenger Car Bodies',
    ticker_root: 'TSLA',
    type: 'CS',
    weighted_shares_outstanding: 3170000000,
    market: 'stocks',
  }
};

// Generate mock price data
const generatePriceData = (ticker: string, days = 30) => {
  const prices = [];
  const basePrice: Record<string, number> = {
    'AAPL': 180,
    'MSFT': 410,
    'GME': 15,
    'AMZN': 180,
    'TSLA': 190
  };
  
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random variation to create realistic price movements
    const randomFactor = 0.98 + Math.random() * 0.04; // Random between 0.98 and 1.02
    const dayPrice = basePrice[ticker] * randomFactor * (1 + (days - i) * 0.005); // Slight upward trend
    
    prices.push({
      c: parseFloat(dayPrice.toFixed(2)), // close price
      h: parseFloat((dayPrice * (1 + Math.random() * 0.02)).toFixed(2)), // high price
      l: parseFloat((dayPrice * (1 - Math.random() * 0.02)).toFixed(2)), // low price
      n: Math.floor(1000 + Math.random() * 5000), // number of transactions
      o: parseFloat((dayPrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)), // open price
      t: Math.floor(date.getTime() / 1000), // timestamp
      v: Math.floor(1000000 + Math.random() * 10000000), // trading volume
      vw: parseFloat(dayPrice.toFixed(2)), // volume weighted average price
    });
  }
  
  return prices;
};

// Generate mock news data
const generateNewsData = (ticker: string) => {
  const tickerToCompany: Record<string, string> = {
    'AAPL': 'Apple',
    'MSFT': 'Microsoft',
    'GME': 'GameStop',
    'AMZN': 'Amazon',
    'TSLA': 'Tesla'
  };
  
  const companyName = tickerToCompany[ticker] || ticker;
  
  return [
    {
      id: `news-${ticker}-1`,
      publisher: {
        name: 'Financial Times',
        homepage_url: 'https://www.ft.com',
        logo_url: 'https://www.ft.com/logo.png',
        favicon_url: 'https://www.ft.com/favicon.ico',
      },
      title: `${companyName} Reports Strong Quarterly Earnings`,
      author: 'Financial Reporter',
      published_utc: new Date(Date.now() - 86400000).toISOString(),
      article_url: 'https://example.com/article1',
      tickers: [ticker],
      amp_url: 'https://example.com/article1/amp',
      image_url: 'https://example.com/image1.jpg',
      description: `${companyName} exceeded analyst expectations with strong quarterly results, driven by robust product sales and services growth.`,
    },
    {
      id: `news-${ticker}-2`,
      publisher: {
        name: 'Wall Street Journal',
        homepage_url: 'https://www.wsj.com',
        logo_url: 'https://www.wsj.com/logo.png',
        favicon_url: 'https://www.wsj.com/favicon.ico',
      },
      title: `${companyName} Announces New Product Line`,
      author: 'Tech Reporter',
      published_utc: new Date(Date.now() - 172800000).toISOString(),
      article_url: 'https://example.com/article2',
      tickers: [ticker],
      amp_url: 'https://example.com/article2/amp',
      image_url: 'https://example.com/image2.jpg',
      description: `${companyName} unveiled its latest product line today, featuring innovative technology and design improvements.`,
    },
    {
      id: `news-${ticker}-3`,
      publisher: {
        name: 'Bloomberg',
        homepage_url: 'https://www.bloomberg.com',
        logo_url: 'https://www.bloomberg.com/logo.png',
        favicon_url: 'https://www.bloomberg.com/favicon.ico',
      },
      title: `${companyName} Expands into New Markets`,
      author: 'Business Reporter',
      published_utc: new Date(Date.now() - 259200000).toISOString(),
      article_url: 'https://example.com/article3',
      tickers: [ticker],
      amp_url: 'https://example.com/article3/amp',
      image_url: 'https://example.com/image3.jpg',
      description: `${companyName} announced plans to expand operations into emerging markets, targeting significant growth opportunities.`,
    },
  ];
};

// Generate mock financial data
const generateFinancialData = (ticker: string) => {
  const baseRevenue: Record<string, number> = {
    'AAPL': 394328000000,
    'MSFT': 211915000000,
    'GME': 5927000000,
    'AMZN': 513983000000,
    'TSLA': 96773000000
  };
  
  const netIncome = (baseRevenue[ticker] || 10000000000) * (Math.random() * 0.1 + 0.1); // 10-20% profit margin
  const assets = (baseRevenue[ticker] || 10000000000) * (Math.random() * 0.5 + 1.5); // 1.5-2x revenue in assets
  const liabilities = assets * (Math.random() * 0.3 + 0.3); // 30-60% of assets are liabilities
  const equity = assets - liabilities;
  
  return [{
    ticker: ticker,
    period_of_report_date: new Date(Date.now() - 7776000000).toISOString().split('T')[0], // 90 days ago
    fiscal_period: 'Q1',
    fiscal_year: new Date().getFullYear().toString(),
    financials: {
      income_statement: {
        revenues: {
          label: 'Revenues',
          order: 1,
          unit: 'USD',
          value: baseRevenue[ticker] / 4, // Quarterly revenue
        },
        net_income_loss: {
          label: 'Net Income (Loss)',
          order: 2,
          unit: 'USD',
          value: netIncome / 4, // Quarterly net income
        },
        basic_earnings_per_share: {
          label: 'Basic Earnings Per Share',
          order: 3,
          unit: 'USD',
          value: (netIncome / 4) / (baseRevenue[ticker] / 100), // Simplified EPS calculation
        },
        diluted_earnings_per_share: {
          label: 'Diluted Earnings Per Share',
          order: 4,
          unit: 'USD',
          value: ((netIncome / 4) / (baseRevenue[ticker] / 100)) * 0.95, // Slightly lower than basic EPS
        },
      },
      balance_sheet: {
        assets: {
          label: 'Assets',
          order: 1,
          unit: 'USD',
          value: assets,
        },
        current_assets: {
          label: 'Current Assets',
          order: 2,
          unit: 'USD',
          value: assets * 0.3, // 30% of assets are current
        },
        liabilities: {
          label: 'Liabilities',
          order: 3,
          unit: 'USD',
          value: liabilities,
        },
        current_liabilities: {
          label: 'Current Liabilities',
          order: 4,
          unit: 'USD',
          value: liabilities * 0.4, // 40% of liabilities are current
        },
        equity: {
          label: 'Equity',
          order: 5,
          unit: 'USD',
          value: equity,
        },
      },
    },
  }];
};

// Mock stock search function to replace the API call
export const mockStockSearch = async (query: string) => {
  // Filter stocks based on query
  const lowercaseQuery = query.toLowerCase();
  const results = stockData.filter(stock => 
    stock.ticker.toLowerCase().includes(lowercaseQuery) || 
    stock.name.toLowerCase().includes(lowercaseQuery)
  );
  
  return { data: { results } };
};

// Mock stock details function
export const mockStockDetails = async (ticker: string) => {
  const details = stockDetails[ticker.toUpperCase() as keyof typeof stockDetails];
  if (!details) {
    throw new Error(`Stock details not found for ${ticker}`);
  }
  return { data: { details } };
};

// Mock stock prices function
export const mockStockPrices = async (ticker: string) => {
  const prices = generatePriceData(ticker.toUpperCase());
  return { data: { prices } };
};

// Mock stock news function
export const mockStockNews = async (ticker: string) => {
  const news = generateNewsData(ticker.toUpperCase());
  return { data: { news } };
};

// Mock financial data function
export const mockFinancialData = async (ticker: string) => {
  const financials = generateFinancialData(ticker.toUpperCase());
  return { data: { financials } };
};

// Mock insider transactions function (empty for now, as we're using Supabase for this)
export const mockInsiderTransactions = async (ticker: string) => {
  return { data: { transactions: { data: [] } } };
};

// Mock insider sentiment function
export const mockInsiderSentiment = async (ticker: string) => {
  return { data: { sentiment: { data: [] } } };
};

export default api; 