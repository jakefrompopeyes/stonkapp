# StonkApp Scripts

This directory contains utility scripts for StonkApp.

## Give Pro Access Script

### Purpose

This script gives a user pro access by updating their profile in the Supabase database.

### Prerequisites

- Node.js installed
- Create a `.env` file in the scripts directory with the following variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

### Installation

1. Navigate to the scripts directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Usage

Run the following command to give a user pro access:

```
npm run give-pro -- <user_id>
```

Replace `<user_id>` with the UUID of the user you want to give pro access to.

Example:
```
npm run give-pro -- 123e4567-e89b-12d3-a456-426614174000
```

### What the Script Does

1. Checks if the user exists in the Supabase `auth.users` table
2. Checks if the user has a profile in the `profiles` table
3. If the user has a profile, it updates the subscription status to 'active' and tier to 'pro'
4. If the user doesn't have a profile, it creates a new profile with subscription status 'active' and tier 'pro'

### Troubleshooting

- Make sure your `.env` file is correctly configured
- Verify that the user ID exists in the `auth.users` table
- Check Supabase logs for any errors

## Verify Profitability Metrics Script

### Purpose

This script verifies the profitability metrics calculations by comparing the values from the FMP API's `ratios-ttm` endpoint with manually calculated values from financial statements.

### Prerequisites

- Node.js installed
- Create a `.env` file in the scripts directory with the following variables:
  ```
  NEXT_PUBLIC_FMP_API_KEY=your_fmp_api_key
  ```

### Usage

Run the following command to verify profitability metrics for a specific ticker:

```
npm run verify-metrics -- <ticker>
```

Replace `<ticker>` with the stock ticker you want to verify. If no ticker is provided, it defaults to 'AAPL'.

Example:
```
npm run verify-metrics -- MSFT
```

### What the Script Does

1. Fetches financial ratios TTM data from the FMP API
2. Fetches the latest income statement and balance sheet data
3. Calculates the following metrics manually:
   - Return on Equity (ROE) = Net Income / Total Stockholder Equity
   - Return on Assets (ROA) = Net Income / Total Assets
   - Operating Profit Margin = Operating Income / Revenue
   - Net Profit Margin = Net Income / Revenue
4. Compares the API values with the manually calculated values
5. Displays the raw data used for calculations

### Understanding the Results

The script will output a comparison between the API values and the manually calculated values. If there are discrepancies, it could be due to:

1. The API using TTM (Trailing Twelve Months) data while the manual calculation uses the latest annual report
2. Different calculation methodologies (e.g., using average equity instead of end-of-period equity)
3. Adjustments made by the API provider to the raw financial data

### Troubleshooting

- Make sure your `.env` file is correctly configured with a valid FMP API key
- Verify that the ticker symbol is valid
- Check if the company has published recent financial statements

## Verify Financial Health Metrics Script

### Purpose

This script verifies the financial health metrics calculations by comparing the values from the FMP API's `ratios` endpoint with manually calculated values from financial statements.

### Prerequisites

- Node.js installed
- Create a `.env` file in the scripts directory with the following variables:
  ```
  NEXT_PUBLIC_FMP_API_KEY=your_fmp_api_key
  ```

### Usage

Run the following command to verify financial health metrics for a specific ticker:

```
npm run verify-health -- <ticker>
```

Replace `<ticker>` with the stock ticker you want to verify. If no ticker is provided, it defaults to 'AAPL'.

Example:
```
npm run verify-health -- MSFT
```

### What the Script Does

1. Fetches financial ratios data from the FMP API
2. Fetches the latest balance sheet and income statement data
3. Calculates the following metrics manually:
   - Current Ratio = Current Assets / Current Liabilities
   - Quick Ratio = (Cash & Equivalents + Short-term Investments + Accounts Receivable) / Current Liabilities
   - Cash Ratio = Cash & Equivalents / Current Liabilities
   - Debt to Equity Ratio = Long-term Debt / Total Equity
   - Debt to Assets Ratio = Long-term Debt / Total Assets
   - Interest Coverage Ratio = EBIT / Interest Expense
4. Compares the API values with the manually calculated values
5. Displays the raw data used for calculations

### Understanding the Results

The script will output a comparison between the API values and the manually calculated values. If there are discrepancies, it could be due to:

1. Different calculation methodologies (e.g., using total liabilities instead of just long-term debt)
2. Adjustments made by the API provider to the raw financial data
3. Different time periods (the API might use quarterly data while the manual calculation uses annual data)

### Troubleshooting

- Make sure your `.env` file is correctly configured with a valid FMP API key
- Verify that the ticker symbol is valid
- Check if the company has published recent financial statements 