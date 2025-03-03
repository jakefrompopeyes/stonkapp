require('dotenv').config();
const fetch = require('node-fetch');

// FMP API configuration
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Test ticker
const TEST_TICKER = process.argv[2] || 'AAPL';

/**
 * Fetch data from FMP API
 */
async function fetchFmpData(endpoint, params = {}) {
  const url = new URL(`${FMP_BASE_URL}/${endpoint}`);
  url.searchParams.append('apikey', FMP_API_KEY);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Error fetching ${endpoint}:`, response.status, response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

/**
 * Calculate profitability metrics manually
 */
function calculateMetrics(incomeStatement, balanceSheet) {
  if (!incomeStatement || !balanceSheet) {
    return null;
  }
  
  // Extract required values
  const netIncome = incomeStatement.netIncome;
  const totalAssets = balanceSheet.totalAssets;
  const totalEquity = balanceSheet.totalStockholdersEquity;
  const revenue = incomeStatement.revenue;
  const operatingIncome = incomeStatement.operatingIncome;
  
  // Calculate metrics
  const calculatedMetrics = {
    returnOnEquity: netIncome && totalEquity ? (netIncome / totalEquity) : null,
    returnOnAssets: netIncome && totalAssets ? (netIncome / totalAssets) : null,
    operatingProfitMargin: operatingIncome && revenue ? (operatingIncome / revenue) : null,
    netProfitMargin: netIncome && revenue ? (netIncome / revenue) : null
  };
  
  return calculatedMetrics;
}

/**
 * Format number as percentage
 */
function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Main function to verify profitability metrics
 */
async function verifyProfitabilityMetrics() {
  console.log(`Verifying profitability metrics for ${TEST_TICKER}...\n`);
  
  // 1. Fetch ratios TTM from the API
  console.log('Fetching financial ratios TTM...');
  const ratiosTtm = await fetchFmpData(`ratios-ttm/${TEST_TICKER}`);
  
  if (!ratiosTtm || !ratiosTtm[0]) {
    console.error('Failed to fetch financial ratios TTM');
    return;
  }
  
  // 2. Fetch latest income statement and balance sheet
  console.log('Fetching latest financial statements...');
  const incomeStatements = await fetchFmpData(`income-statement/${TEST_TICKER}`, { limit: 1 });
  const balanceSheets = await fetchFmpData(`balance-sheet-statement/${TEST_TICKER}`, { limit: 1 });
  
  if (!incomeStatements || !incomeStatements[0] || !balanceSheets || !balanceSheets[0]) {
    console.error('Failed to fetch financial statements');
    return;
  }
  
  const latestIncomeStatement = incomeStatements[0];
  const latestBalanceSheet = balanceSheets[0];
  
  // 3. Calculate metrics manually
  const calculatedMetrics = calculateMetrics(latestIncomeStatement, latestBalanceSheet);
  
  if (!calculatedMetrics) {
    console.error('Failed to calculate metrics');
    return;
  }
  
  // 4. Compare API values with calculated values
  console.log('\n=== PROFITABILITY METRICS COMPARISON ===');
  console.log(`\nDate of financial statements: ${latestIncomeStatement.date}`);
  
  console.log('\n1. Return on Equity (ROE)');
  console.log(`API Value: ${formatPercentage(ratiosTtm[0].returnOnEquityTTM)}`);
  console.log(`Calculated: ${formatPercentage(calculatedMetrics.returnOnEquity)}`);
  console.log(`Formula: Net Income (${latestIncomeStatement.netIncome}) / Total Equity (${latestBalanceSheet.totalStockholdersEquity})`);
  
  console.log('\n2. Return on Assets (ROA)');
  console.log(`API Value: ${formatPercentage(ratiosTtm[0].returnOnAssetsTTM)}`);
  console.log(`Calculated: ${formatPercentage(calculatedMetrics.returnOnAssets)}`);
  console.log(`Formula: Net Income (${latestIncomeStatement.netIncome}) / Total Assets (${latestBalanceSheet.totalAssets})`);
  
  console.log('\n3. Operating Profit Margin');
  console.log(`API Value: ${formatPercentage(ratiosTtm[0].operatingProfitMarginTTM)}`);
  console.log(`Calculated: ${formatPercentage(calculatedMetrics.operatingProfitMargin)}`);
  console.log(`Formula: Operating Income (${latestIncomeStatement.operatingIncome}) / Revenue (${latestIncomeStatement.revenue})`);
  
  console.log('\n4. Net Profit Margin');
  console.log(`API Value: ${formatPercentage(ratiosTtm[0].netProfitMarginTTM)}`);
  console.log(`Calculated: ${formatPercentage(calculatedMetrics.netProfitMargin)}`);
  console.log(`Formula: Net Income (${latestIncomeStatement.netIncome}) / Revenue (${latestIncomeStatement.revenue})`);
  
  console.log('\n=== RAW DATA ===');
  console.log('\nIncome Statement Data:');
  console.log(`- Revenue: ${latestIncomeStatement.revenue}`);
  console.log(`- Operating Income: ${latestIncomeStatement.operatingIncome}`);
  console.log(`- Net Income: ${latestIncomeStatement.netIncome}`);
  
  console.log('\nBalance Sheet Data:');
  console.log(`- Total Assets: ${latestBalanceSheet.totalAssets}`);
  console.log(`- Total Equity: ${latestBalanceSheet.totalStockholdersEquity}`);
  
  console.log('\nRatios TTM Data:');
  console.log(`- ROE TTM: ${ratiosTtm[0].returnOnEquityTTM}`);
  console.log(`- ROA TTM: ${ratiosTtm[0].returnOnAssetsTTM}`);
  console.log(`- Operating Profit Margin TTM: ${ratiosTtm[0].operatingProfitMarginTTM}`);
  console.log(`- Net Profit Margin TTM: ${ratiosTtm[0].netProfitMarginTTM}`);
}

// Run the verification
verifyProfitabilityMetrics(); 