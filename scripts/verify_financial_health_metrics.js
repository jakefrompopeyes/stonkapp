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
 * Calculate financial health metrics manually
 */
function calculateMetrics(balanceSheet) {
  if (!balanceSheet) {
    return null;
  }
  
  // Extract required values
  const currentAssets = balanceSheet.totalCurrentAssets;
  const currentLiabilities = balanceSheet.totalCurrentLiabilities;
  const cashAndCashEquivalents = balanceSheet.cashAndCashEquivalents;
  const shortTermInvestments = balanceSheet.shortTermInvestments || 0;
  const accountsReceivable = balanceSheet.netReceivables;
  const totalAssets = balanceSheet.totalAssets;
  const totalLiabilities = balanceSheet.totalLiabilities;
  const totalEquity = balanceSheet.totalStockholdersEquity;
  const longTermDebt = balanceSheet.longTermDebt;
  
  // Calculate metrics
  const calculatedMetrics = {
    // Liquidity Ratios
    currentRatio: currentAssets && currentLiabilities ? (currentAssets / currentLiabilities) : null,
    quickRatio: (cashAndCashEquivalents && shortTermInvestments && accountsReceivable && currentLiabilities) ? 
      ((cashAndCashEquivalents + shortTermInvestments + accountsReceivable) / currentLiabilities) : null,
    cashRatio: (cashAndCashEquivalents && currentLiabilities) ? 
      (cashAndCashEquivalents / currentLiabilities) : null,
    
    // Solvency Ratios
    debtToEquityRatio: (longTermDebt && totalEquity) ? 
      (longTermDebt / totalEquity) : null,
    debtToAssetsRatio: (longTermDebt && totalAssets) ? 
      (longTermDebt / totalAssets) : null
  };
  
  return calculatedMetrics;
}

/**
 * Calculate interest coverage ratio from income statement
 */
function calculateInterestCoverage(incomeStatement) {
  if (!incomeStatement) {
    return null;
  }
  
  const ebit = incomeStatement.ebit || incomeStatement.operatingIncome;
  const interestExpense = incomeStatement.interestExpense;
  
  if (!ebit || !interestExpense) {
    return null;
  }
  
  return ebit / Math.abs(interestExpense);
}

/**
 * Format number with specified decimals
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Main function to verify financial health metrics
 */
async function verifyFinancialHealthMetrics() {
  console.log(`Verifying financial health metrics for ${TEST_TICKER}...\n`);
  
  // 1. Fetch financial ratios from the API
  console.log('Fetching financial ratios...');
  const ratios = await fetchFmpData(`ratios/${TEST_TICKER}`);
  
  if (!ratios || !ratios[0]) {
    console.error('Failed to fetch financial ratios');
    return;
  }
  
  const latestRatios = ratios[0];
  
  // 2. Fetch latest balance sheet
  console.log('Fetching latest balance sheet...');
  const balanceSheets = await fetchFmpData(`balance-sheet-statement/${TEST_TICKER}`, { limit: 1 });
  
  if (!balanceSheets || !balanceSheets[0]) {
    console.error('Failed to fetch balance sheet');
    return;
  }
  
  const latestBalanceSheet = balanceSheets[0];
  
  // 3. Fetch latest income statement for interest coverage
  console.log('Fetching latest income statement...');
  const incomeStatements = await fetchFmpData(`income-statement/${TEST_TICKER}`, { limit: 1 });
  
  if (!incomeStatements || !incomeStatements[0]) {
    console.error('Failed to fetch income statement');
    return;
  }
  
  const latestIncomeStatement = incomeStatements[0];
  
  // 4. Calculate metrics manually
  const calculatedMetrics = calculateMetrics(latestBalanceSheet);
  const interestCoverage = calculateInterestCoverage(latestIncomeStatement);
  
  if (!calculatedMetrics) {
    console.error('Failed to calculate metrics');
    return;
  }
  
  // 5. Compare API values with calculated values
  console.log('\n=== FINANCIAL HEALTH METRICS COMPARISON ===');
  console.log(`\nDate of financial statements: ${latestBalanceSheet.date}`);
  
  console.log('\n1. Current Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.currentRatio)}`);
  console.log(`Calculated: ${formatNumber(calculatedMetrics.currentRatio)}`);
  console.log(`Formula: Current Assets (${latestBalanceSheet.totalCurrentAssets}) / Current Liabilities (${latestBalanceSheet.totalCurrentLiabilities})`);
  
  console.log('\n2. Quick Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.quickRatio)}`);
  console.log(`Calculated: ${formatNumber(calculatedMetrics.quickRatio)}`);
  console.log(`Formula: (Cash & Equivalents (${latestBalanceSheet.cashAndCashEquivalents}) + Short-term Investments (${latestBalanceSheet.shortTermInvestments || 0}) + Accounts Receivable (${latestBalanceSheet.netReceivables})) / Current Liabilities (${latestBalanceSheet.totalCurrentLiabilities})`);
  
  console.log('\n3. Cash Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.cashRatio)}`);
  console.log(`Calculated: ${formatNumber(calculatedMetrics.cashRatio)}`);
  console.log(`Formula: Cash & Equivalents (${latestBalanceSheet.cashAndCashEquivalents}) / Current Liabilities (${latestBalanceSheet.totalCurrentLiabilities})`);
  
  console.log('\n4. Debt to Equity Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.debtEquityRatio)}`);
  console.log(`Calculated: ${formatNumber(calculatedMetrics.debtToEquityRatio)}`);
  console.log(`Formula: Long-term Debt (${latestBalanceSheet.longTermDebt}) / Total Equity (${latestBalanceSheet.totalStockholdersEquity})`);
  
  console.log('\n5. Debt to Assets Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.debtRatio)}`);
  console.log(`Calculated: ${formatNumber(calculatedMetrics.debtToAssetsRatio)}`);
  console.log(`Formula: Long-term Debt (${latestBalanceSheet.longTermDebt}) / Total Assets (${latestBalanceSheet.totalAssets})`);
  
  console.log('\n6. Interest Coverage Ratio');
  console.log(`API Value: ${formatNumber(latestRatios.interestCoverage)}`);
  console.log(`Calculated: ${formatNumber(interestCoverage)}`);
  console.log(`Formula: EBIT (${latestIncomeStatement.ebit || latestIncomeStatement.operatingIncome}) / Interest Expense (${Math.abs(latestIncomeStatement.interestExpense)})`);
  
  console.log('\n=== RAW DATA ===');
  console.log('\nBalance Sheet Data:');
  console.log(`- Total Current Assets: ${latestBalanceSheet.totalCurrentAssets}`);
  console.log(`- Total Current Liabilities: ${latestBalanceSheet.totalCurrentLiabilities}`);
  console.log(`- Cash & Cash Equivalents: ${latestBalanceSheet.cashAndCashEquivalents}`);
  console.log(`- Short-term Investments: ${latestBalanceSheet.shortTermInvestments || 0}`);
  console.log(`- Accounts Receivable: ${latestBalanceSheet.netReceivables}`);
  console.log(`- Total Assets: ${latestBalanceSheet.totalAssets}`);
  console.log(`- Total Liabilities: ${latestBalanceSheet.totalLiabilities}`);
  console.log(`- Total Equity: ${latestBalanceSheet.totalStockholdersEquity}`);
  console.log(`- Long-term Debt: ${latestBalanceSheet.longTermDebt}`);
  
  console.log('\nIncome Statement Data:');
  console.log(`- EBIT: ${latestIncomeStatement.ebit || latestIncomeStatement.operatingIncome}`);
  console.log(`- Interest Expense: ${latestIncomeStatement.interestExpense}`);
  
  console.log('\nFinancial Ratios Data:');
  console.log(`- Current Ratio: ${latestRatios.currentRatio}`);
  console.log(`- Quick Ratio: ${latestRatios.quickRatio}`);
  console.log(`- Cash Ratio: ${latestRatios.cashRatio}`);
  console.log(`- Debt to Equity Ratio: ${latestRatios.debtEquityRatio}`);
  console.log(`- Debt to Assets Ratio: ${latestRatios.debtRatio}`);
  console.log(`- Interest Coverage Ratio: ${latestRatios.interestCoverage}`);
}

// Run the verification
verifyFinancialHealthMetrics(); 