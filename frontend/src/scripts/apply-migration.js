const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20240701_user_stock_views.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { query: migrationSQL });

    if (error) {
      console.error('Error applying migration:', error);
      return;
    }

    console.log('Migration applied successfully!');
    
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
    console.error('Exception during migration:', error);
  }
}

applyMigration(); 