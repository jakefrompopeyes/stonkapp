const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache with 10 minute TTL (time to live)
const cache = new NodeCache({ stdTTL: 600 });

// Base URL for Finnhub API
const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY || 'cuufs59r01qlidi3qulgcuufs59r01qlidi3qum0';

/**
 * Get insider transactions for a specific stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Insider transactions data
 */
async function getInsiderTransactions(ticker) {
  const cacheKey = `insider_transactions_${ticker}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/stock/insider-transactions`, {
      params: {
        symbol: ticker,
        token: API_KEY
      }
    });
    
    console.log('Finnhub insider transactions response:', JSON.stringify(response.data, null, 2));
    
    // Process the data to ensure it's in the correct format
    const processedData = {
      ...response.data,
      data: (response.data.data || []).map(transaction => ({
        ...transaction,
        // Ensure change is a number
        change: typeof transaction.change === 'string' 
          ? parseFloat(transaction.change) 
          : transaction.change,
        // Ensure transactionPrice is a number
        transactionPrice: typeof transaction.transactionPrice === 'string' 
          ? parseFloat(transaction.transactionPrice) 
          : transaction.transactionPrice
      }))
    };
    
    // Cache the processed result
    cache.set(cacheKey, processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching insider transactions:', error.message);
    throw new Error(`Failed to fetch insider transactions for ${ticker}`);
  }
}

/**
 * Get insider sentiment for a specific stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Insider sentiment data
 */
async function getInsiderSentiment(ticker) {
  const cacheKey = `insider_sentiment_${ticker}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/stock/insider-sentiment`, {
      params: {
        symbol: ticker,
        token: API_KEY
      }
    });
    
    console.log('Finnhub insider sentiment response:', response.data);
    
    // Cache the result
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching insider sentiment:', error.message);
    throw new Error(`Failed to fetch insider sentiment for ${ticker}`);
  }
}

module.exports = {
  getInsiderTransactions,
  getInsiderSentiment
}; 