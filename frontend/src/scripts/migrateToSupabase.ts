/**
 * This script helps migrate insider trading data from your existing API to Supabase.
 * Run this script with: npx ts-node src/scripts/migrateToSupabase.ts
 */

import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { InsiderTransaction } from '../lib/stockApi';

// List of tickers you want to migrate data for
const TICKERS_TO_MIGRATE = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'TSLA',
  // Add more tickers as needed
];

// Function to fetch insider transactions from your API
async function fetchInsiderTransactionsFromAPI(ticker: string): Promise<InsiderTransaction[]> {
  try {
    const response = await api.get(`/api/stocks/insider-transactions/${ticker}`);
    return response.data.transactions.data || [];
  } catch (error) {
    console.error(`Error fetching insider transactions for ${ticker}:`, error);
    return [];
  }
}

// Function to store insider transactions in Supabase
async function storeInsiderTransactionsInSupabase(transactions: InsiderTransaction[]) {
  if (transactions.length === 0) return;
  
  try {
    // Insert data in batches to avoid hitting request size limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('insider_trading')
        .upsert(batch, { 
          onConflict: 'id', // Assuming 'id' is a unique identifier
          ignoreDuplicates: true 
        });
      
      if (error) {
        console.error('Error storing batch in Supabase:', error);
      } else {
        console.log(`Successfully stored batch ${i / BATCH_SIZE + 1} in Supabase`);
      }
    }
  } catch (error) {
    console.error('Error storing transactions in Supabase:', error);
  }
}

// Main migration function
async function migrateInsiderTradingData() {
  console.log('Starting migration of insider trading data to Supabase...');
  
  for (const ticker of TICKERS_TO_MIGRATE) {
    console.log(`Migrating data for ${ticker}...`);
    
    // Fetch data from API
    const transactions = await fetchInsiderTransactionsFromAPI(ticker);
    console.log(`Found ${transactions.length} transactions for ${ticker}`);
    
    // Store in Supabase
    await storeInsiderTransactionsInSupabase(transactions);
    
    console.log(`Completed migration for ${ticker}`);
  }
  
  console.log('Migration completed!');
}

// Run the migration
migrateInsiderTradingData().catch(console.error); 