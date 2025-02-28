import { supabase } from './supabase';

// Function to get the number of stock views for a user
export async function getUserStockViews(userId: string) {
  if (!userId) return [];
  
  console.log(`getUserStockViews called for user ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('user_stock_views')
      .select('ticker')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user stock views:', error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} stock views for user ${userId}:`, data);
    return data || [];
  } catch (e) {
    console.error('Exception fetching user stock views:', e);
    return [];
  }
}

// Function to track a stock view for a user
export async function trackStockView(userId: string, ticker: string) {
  if (!userId) return { success: false, error: 'No user ID provided' };
  
  console.log(`trackStockView called for user ${userId} and ticker ${ticker}`);
  
  const now = new Date().toISOString();
  
  try {
    // First check if the view already exists
    const { data: existingView, error: checkError } = await supabase
      .from('user_stock_views')
      .select('id')
      .eq('user_id', userId)
      .eq('ticker', ticker)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
      console.error('Error checking existing view:', checkError);
    }
    
    // If view exists, just update the timestamp
    if (existingView) {
      console.log(`View already exists for ${userId} and ${ticker}, updating timestamp`);
      const { data, error } = await supabase
        .from('user_stock_views')
        .update({ viewed_at: now })
        .eq('id', existingView.id);
        
      if (error) {
        console.error('Error updating existing view:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Successfully updated view timestamp');
      return { success: true, data };
    }
    
    // Otherwise insert a new record
    console.log(`Inserting new view for ${userId} and ${ticker}`);
    const { data, error } = await supabase
      .from('user_stock_views')
      .insert({ 
        user_id: userId, 
        ticker: ticker,
        viewed_at: now,
        last_reset_at: now
      });
      
    if (error) {
      console.error('Error inserting new view:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Successfully inserted new view:', data);
    return { success: true, data };
  } catch (e) {
    console.error('Exception tracking stock view:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// Function to get user profile data including subscription status
export async function getUserProfile(userId: string) {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
} 