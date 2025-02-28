import { supabase } from '../lib/supabase';

async function testInsiderData() {
  try {
    // Check if the insider_trading table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('Available tables:', tables);
    
    // Try to get data from the insider_trading table
    const { data, error } = await supabase
      .from('insider_trading')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Error fetching insider trading data:', error);
      return;
    }
    
    console.log('Insider trading data count:', data);
    
    // Try to get a sample of data
    const { data: sampleData, error: sampleError } = await supabase
      .from('insider_trading')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
      return;
    }
    
    console.log('Sample insider trading data:', sampleData);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testInsiderData(); 