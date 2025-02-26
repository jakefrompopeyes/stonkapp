const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache with 10 minute TTL (time to live)
const cache = new NodeCache({ stdTTL: 600 });

// Base URL for Polygon.io API
const BASE_URL = 'https://api.polygon.io';
const API_KEY = process.env.POLYGON_API_KEY;

/**
 * Search for stocks by ticker symbol or company name
 * @param {string} query - Search query (ticker or company name)
 * @returns {Promise<Array>} - Array of matching stocks
 */
async function searchStocks(query) {
  const cacheKey = `search_${query}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/v3/reference/tickers`, {
      params: {
        search: query,
        active: true,
        sort: 'ticker',
        order: 'asc',
        limit: 10,
        apiKey: API_KEY
      }
    });
    
    const results = response.data.results || [];
    cache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    throw new Error('Failed to search stocks');
  }
}

/**
 * Get detailed information for a specific stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Stock details
 */
async function getStockDetails(ticker) {
  const cacheKey = `details_${ticker}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/v3/reference/tickers/${ticker}`, {
      params: {
        apiKey: API_KEY
      }
    });
    
    const stockDetails = response.data.results;
    cache.set(cacheKey, stockDetails);
    return stockDetails;
  } catch (error) {
    console.error(`Error fetching details for ${ticker}:`, error.message);
    throw new Error(`Failed to get details for ${ticker}`);
  }
}

/**
 * Get daily price data for a stock
 * @param {string} ticker - Stock ticker symbol
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @param {string} timespan - Timespan for aggregation (day, minute, hour, etc.)
 * @param {number} multiplier - Multiplier for timespan (1, 5, 15, etc.)
 * @returns {Promise<Array>} - Array of price data
 */
async function getDailyPrices(ticker, from, to, timespan = 'day', multiplier = 1) {
  const cacheKey = `daily_${ticker}_${from}_${to}_${timespan}_${multiplier}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`, {
      params: {
        adjusted: true,
        sort: 'asc',
        apiKey: API_KEY
      }
    });
    
    const priceData = response.data.results || [];
    cache.set(cacheKey, priceData);
    return priceData;
  } catch (error) {
    console.error(`Error fetching price data for ${ticker}:`, error.message);
    throw new Error(`Failed to get price data for ${ticker}`);
  }
}

/**
 * Get latest news for a stock
 * @param {string} ticker - Stock ticker symbol
 * @param {number} limit - Number of news items to return
 * @returns {Promise<Array>} - Array of news items
 */
async function getStockNews(ticker, limit = 5) {
  const cacheKey = `news_${ticker}_${limit}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/v2/reference/news`, {
      params: {
        ticker,
        order: 'desc',
        limit,
        sort: 'published_utc',
        apiKey: API_KEY
      }
    });
    
    const newsItems = response.data.results || [];
    cache.set(cacheKey, newsItems);
    return newsItems;
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error.message);
    throw new Error(`Failed to get news for ${ticker}`);
  }
}

/**
 * Get financial data for a stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Financial data
 */
async function getFinancialData(ticker) {
  const cacheKey = `financials_${ticker}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Get the latest quarterly financials
    const response = await axios.get(`${BASE_URL}/vX/reference/financials`, {
      params: {
        ticker,
        limit: 4,
        timeframe: 'quarterly',
        sort: 'period_of_report_date',
        order: 'desc',
        apiKey: API_KEY
      }
    });
    
    const financials = response.data.results || [];
    
    // Log the response for debugging
    console.log(`Financial data for ${ticker}:`, JSON.stringify(financials.slice(0, 1), null, 2));
    
    // Ensure each financial item has fiscal_period and fiscal_year
    const processedFinancials = financials.map(item => {
      // If fiscal_period or fiscal_year is missing, try to extract from period_of_report_date
      if (!item.fiscal_period || !item.fiscal_year) {
        const reportDate = new Date(item.period_of_report_date);
        const month = reportDate.getMonth();
        
        // Determine quarter based on month
        let quarter;
        if (month >= 0 && month <= 2) quarter = 'Q1';
        else if (month >= 3 && month <= 5) quarter = 'Q2';
        else if (month >= 6 && month <= 8) quarter = 'Q3';
        else quarter = 'Q4';
        
        return {
          ...item,
          fiscal_period: item.fiscal_period || quarter,
          fiscal_year: item.fiscal_year || reportDate.getFullYear().toString()
        };
      }
      
      return item;
    });
    
    cache.set(cacheKey, processedFinancials);
    return processedFinancials;
  } catch (error) {
    console.error(`Error fetching financials for ${ticker}:`, error.message);
    throw new Error(`Failed to get financials for ${ticker}`);
  }
}

module.exports = {
  searchStocks,
  getStockDetails,
  getDailyPrices,
  getStockNews,
  getFinancialData
}; 