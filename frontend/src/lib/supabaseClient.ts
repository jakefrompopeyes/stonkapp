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
    const { data, error } = await supabase
      .from('user_stock_views')
      .upsert(
        { 
          user_id: userId, 
          ticker: ticker,
          viewed_at: now,
          last_reset_at: now // This will be updated only for new records
        },
        { 
          onConflict: 'user_id,ticker',
          ignoreDuplicates: false // Update the viewed_at timestamp if the record already exists
        }
      );
      
    if (error) {
      console.error('Error tracking stock view:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Successfully tracked stock view:', data);
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