/**
 * This script tests the connection to Supabase.
 * Run this script with: npx ts-node src/scripts/testSupabaseConnection.ts
 */

import { supabase } from '../lib/supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test the connection by getting the current user
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Session data:', data);
    
    // Test database access by checking if the insider_trading table exists
    const { error: tableError } = await supabase
      .from('insider_trading')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing insider_trading table:', tableError.message);
      console.log('Make sure you have created the insider_trading table in your Supabase project.');
      return;
    }
    
    console.log('Successfully accessed the insider_trading table!');
    console.log('Your Supabase configuration is working correctly.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseConnection().catch(console.error); 