const axios = require('axios');

// API keys
const FINNHUB_API_KEY = 'cuufs59r01qlidi3qulgcuufs59r01qlidi3qum0';
const POLYGON_API_KEY = ''; // Add your Polygon.io API key here

// Base URLs
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const POLYGON_BASE_URL = 'https://api.polygon.io/v2';

// Test ticker
const TEST_TICKER = 'AAPL';

async function testFinancialMetrics() {
  console.log(`Testing financial metrics for ${TEST_TICKER}...`);
  console.log('\n--- FINNHUB API ---');
  await testFinnhubBasicFinancials();
  await testFinnhubPriceMetrics();
  
  console.log('\n--- POLYGON.IO API ---');
  if (POLYGON_API_KEY) {
    await testPolygonFinancials();
  } else {
    console.log('Polygon API key not provided. Skipping Polygon tests.');
  }
}

async function testFinnhubBasicFinancials() {
  console.log('Testing Finnhub basic financials...');
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/metric`, {
      params: {
        symbol: TEST_TICKER,
        metric: 'all',
        token: FINNHUB_API_KEY
      }
    });

    console.log('Finnhub basic financials response:');
    
    // Check for PE ratio with different naming conventions
    const peRatios = {
      'PE Ratio (Annual)': response.data.metric?.peAnnual,
      'PE Ratio (TTM)': response.data.metric?.peTTM,
      'PE Ratio (Excluding Extras, Annual)': response.data.metric?.peExclExtraAnnual,
      'PE Ratio (Excluding Extras, TTM)': response.data.metric?.peExclExtraTTM,
    };
    
    // Check for Price to Sales ratio with different naming conventions
    const priceToSalesRatios = {
      'Price to Sales Ratio (Annual)': response.data.metric?.psAnnual,
      'Price to Sales Ratio (TTM)': response.data.metric?.psTTM,
    };
    
    // Print PE ratios
    console.log('\nPE Ratios found:');
    let foundPeRatio = false;
    for (const [key, value] of Object.entries(peRatios)) {
      if (value !== undefined) {
        console.log(`${key}: ${value}`);
        foundPeRatio = true;
      }
    }
    if (!foundPeRatio) {
      console.log('No PE Ratios found in the response');
    }
    
    // Print Price to Sales ratios
    console.log('\nPrice to Sales Ratios found:');
    let foundPsRatio = false;
    for (const [key, value] of Object.entries(priceToSalesRatios)) {
      if (value !== undefined) {
        console.log(`${key}: ${value}`);
        foundPsRatio = true;
      }
    }
    if (!foundPsRatio) {
      console.log('No Price to Sales Ratios found in the response');
    }
    
    // Print all available metrics for reference
    console.log('\nAll available metrics:');
    for (const [key, value] of Object.entries(response.data.metric || {})) {
      console.log(`${key}: ${value}`);
    }
  } catch (error) {
    console.error('Error fetching Finnhub basic financials:', error);
  }
}

async function testFinnhubPriceMetrics() {
  console.log('Testing Finnhub price metrics...');
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/price-target`, {
      params: {
        symbol: TEST_TICKER,
        token: FINNHUB_API_KEY
      }
    });

    console.log('Finnhub price metrics response:', response.data);
  } catch (error) {
    console.error('Error fetching Finnhub price metrics:', error);
  }
}

async function testPolygonFinancials() {
  console.log('Testing Polygon financials...');
  try {
    // Test Polygon's Ticker Details endpoint
    const detailsResponse = await axios.get(`${POLYGON_BASE_URL}/reference/tickers/${TEST_TICKER}`, {
      params: {
        apiKey: POLYGON_API_KEY
      }
    });
    console.log('Polygon ticker details response:', detailsResponse.data);

    // Test Polygon's Financial Ratios endpoint
    const ratiosResponse = await axios.get(`${POLYGON_BASE_URL}/reference/financial-ratios/${TEST_TICKER}`, {
      params: {
        apiKey: POLYGON_API_KEY
      }
    });
    console.log('Polygon financial ratios response:', ratiosResponse.data);
  } catch (error) {
    console.error('Error fetching Polygon financials:', error);
  }
}

// Run the tests
testFinancialMetrics(); 