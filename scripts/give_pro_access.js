// Script to give a user pro access
// Usage: node give_pro_access.js <user_id>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function giveProAccess(userId) {
  if (!userId) {
    console.error('Error: User ID is required.');
    console.error('Usage: node give_pro_access.js <user_id>');
    process.exit(1);
  }

  console.log(`Giving pro access to user: ${userId}`);

  try {
    // First check if the user exists
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error checking if user exists:', userError.message);
      process.exit(1);
    }

    if (!user) {
      console.error(`User with ID ${userId} not found.`);
      process.exit(1);
    }

    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking user profile:', profileError.message);
      process.exit(1);
    }

    if (!profile) {
      // Create a profile if it doesn't exist
      console.log(`Creating profile for user ${userId} with pro access...`);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          subscription_status: 'active',
          subscription_tier: 'pro',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError.message);
        process.exit(1);
      }

      console.log('Profile created successfully with pro access!');
      console.log(newProfile);
    } else {
      // Update the existing profile
      console.log(`Updating profile for user ${userId} with pro access...`);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_tier: 'pro',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError.message);
        process.exit(1);
      }

      console.log('Profile updated successfully with pro access!');
      console.log(updatedProfile);
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];
giveProAccess(userId); 