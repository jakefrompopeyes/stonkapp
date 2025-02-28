const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if available
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to create the user_stock_views table
const createTableSQL = `
-- Create a table to track user stock views
CREATE TABLE IF NOT EXISTS public.user_stock_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Create a unique constraint to prevent duplicate entries
  UNIQUE(user_id, ticker)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.user_stock_views ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own records
CREATE POLICY "Users can view their own view history" 
  ON public.user_stock_views 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own records
CREATE POLICY "Users can insert their own view history" 
  ON public.user_stock_views 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own records
CREATE POLICY "Users can update their own view history" 
  ON public.user_stock_views 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_stock_views_user_id ON public.user_stock_views(user_id);
`;

async function createTable() {
  try {
    console.log('Creating user_stock_views table...');
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // If the exec_sql RPC function is not available, we need an alternative approach
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('The exec_sql function is not available. Please run this SQL in the Supabase SQL Editor instead.');
        console.log('SQL to run:');
        console.log(createTableSQL);
      }
      
      return;
    }
    
    console.log('Table created successfully!');
    
    // Verify the table was created
    const { data, error: verifyError } = await supabase
      .from('user_stock_views')
      .select('count(*)', { count: 'exact', head: true });
      
    if (verifyError) {
      console.error('Error verifying table creation:', verifyError);
      return;
    }
    
    console.log('Table verified! Current row count:', data);
    
  } catch (error) {
    console.error('Exception during table creation:', error);
  }
}

createTable(); 