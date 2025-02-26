/**
 * This script tests the connection to Supabase.
 * Run this script with: npx ts-node src/scripts/testSupabaseConnection.ts
 */

// Using require instead of import for CommonJS compatibility
const { createClient } = require('@supabase/supabase-js');

// These values should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://skmllawzddrnfjwzoaze.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbWxsYXd6ZGRybmZqd3pvYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NjI4NDksImV4cCI6MjA1NjEzODg0OX0.rslAR876PSBes7VGR0tcx1IHjJPVTfZtIZ8FckJRe_0';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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