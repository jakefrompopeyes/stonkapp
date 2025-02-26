const express = require('express');
const router = express.Router();
const polygonService = require('../services/polygonService');
const finnhubService = require('../services/finnhubService');

// Search for stocks
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await polygonService.searchStocks(query);
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock details
router.get('/details/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    const details = await polygonService.getStockDetails(ticker);
    res.json({ details });
  } catch (error) {
    console.error('Details error:', error);
    res.status(500).json({ error: `Failed to get details for ${req.params.ticker}` });
  }
});

// Get daily price data
router.get('/prices/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { from, to, timespan, multiplier } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    // Default to last 30 days if dates not provided
    const endDate = to || new Date().toISOString().split('T')[0];
    const startDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Parse multiplier as integer if provided
    const parsedMultiplier = multiplier ? parseInt(multiplier) : undefined;
    
    const prices = await polygonService.getDailyPrices(
      ticker, 
      startDate, 
      endDate, 
      timespan, 
      parsedMultiplier
    );
    res.json({ prices });
  } catch (error) {
    console.error('Prices error:', error);
    res.status(500).json({ error: `Failed to get prices for ${req.params.ticker}` });
  }
});

// Get stock news
router.get('/news/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    const news = await polygonService.getStockNews(ticker, limit ? parseInt(limit) : 5);
    res.json({ news });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ error: `Failed to get news for ${req.params.ticker}` });
  }
});

// Get financial data
router.get('/financials/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    const financials = await polygonService.getFinancialData(ticker);
    res.json({ financials });
  } catch (error) {
    console.error('Financials error:', error);
    res.status(500).json({ error: `Failed to get financials for ${req.params.ticker}` });
  }
});

// Get insider transactions
router.get('/insider-transactions/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    const transactions = await finnhubService.getInsiderTransactions(ticker);
    res.json({ transactions });
  } catch (error) {
    console.error('Insider transactions error:', error);
    res.status(500).json({ error: `Failed to get insider transactions for ${req.params.ticker}` });
  }
});

// Get insider sentiment
router.get('/insider-sentiment/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }
    
    const sentiment = await finnhubService.getInsiderSentiment(ticker);
    res.json({ sentiment });
  } catch (error) {
    console.error('Insider sentiment error:', error);
    res.status(500).json({ error: `Failed to get insider sentiment for ${req.params.ticker}` });
  }
});

module.exports = router; 