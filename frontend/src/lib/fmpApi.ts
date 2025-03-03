// Financial Modeling Prep API configuration
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

/**
 * Get company profile information
 */
export const getCompanyProfile = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/profile/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching company profile for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching company profile for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get company financial ratios
 */
export const getFinancialRatios = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/ratios/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching financial ratios for ${ticker}:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching financial ratios for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get company financial statements
 */
export const getFinancialStatements = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/income-statement/${ticker}?limit=4&apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching financial statements for ${ticker}:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching financial statements for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get company key metrics
 */
export const getKeyMetrics = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/key-metrics/${ticker}?limit=1&apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching key metrics for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching key metrics for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get company stock quote
 */
export const getStockQuote = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/quote/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching stock quote for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching stock quote for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get company historical dividends
 */
export const getHistoricalDividends = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/historical-price-full/stock_dividend/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching historical dividends for ${ticker}:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.historical || [];
  } catch (error) {
    console.error(`Error fetching historical dividends for ${ticker}:`, error);
    return [];
  }
};

/**
 * Get company DCF analysis
 */
export const getDCFAnalysis = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/discounted-cash-flow/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching DCF analysis for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching DCF analysis for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get key metrics TTM (Trailing Twelve Months)
 */
export const getKeyMetricsTTM = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/key-metrics-ttm/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching key metrics TTM for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching key metrics TTM for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get financial ratios TTM
 */
export const getFinancialRatiosTTM = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/ratios-ttm/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching financial ratios TTM for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching financial ratios TTM for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get company rating
 */
export const getCompanyRating = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/rating/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching company rating for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching company rating for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get financial score
 */
export const getFinancialScore = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/score?symbol=${ticker}&apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching financial score for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching financial score for ${ticker}:`, error);
    return null;
  }
};

/**
 * Get enterprise value
 */
export const getEnterpriseValue = async (ticker: string) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/enterprise-values/${ticker}?apikey=${FMP_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Error fetching enterprise value for ${ticker}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching enterprise value for ${ticker}:`, error);
    return null;
  }
}; 