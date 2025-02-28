import { getUserStockViews, trackStockView } from './supabaseClient';
import { supabase } from './supabase';

// Constants for view limits
export const ANONYMOUS_VIEW_LIMIT = 2;
export const AUTHENTICATED_VIEW_LIMIT = 3;
export const TOTAL_FREE_VIEWS = ANONYMOUS_VIEW_LIMIT + AUTHENTICATED_VIEW_LIMIT;

// Local storage key for anonymous views
const ANONYMOUS_VIEWS_KEY = 'anonymous_stock_views';

// Functions for anonymous users
export function getAnonymousViews(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  const storedViews = localStorage.getItem(ANONYMOUS_VIEWS_KEY);
  return storedViews ? JSON.parse(storedViews) : {};
}

export function trackAnonymousView(ticker: string): void {
  if (typeof window === 'undefined') return;
  
  const views = getAnonymousViews();
  views[ticker] = true;
  localStorage.setItem(ANONYMOUS_VIEWS_KEY, JSON.stringify(views));
}

export function resetAnonymousViews(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(ANONYMOUS_VIEWS_KEY);
}

// Functions for authenticated users
export async function getAuthenticatedViews(userId: string): Promise<string[]> {
  if (!userId) return [];
  
  // Check if we need to reset views at the end of the month
  await checkMonthlyReset(userId);
  
  const views = await getUserStockViews(userId);
  return views.map(view => view.ticker);
}

export async function trackAuthenticatedView(userId: string, ticker: string): Promise<boolean> {
  if (!userId) return false;
  
  // Check if we need to reset views at the end of the month
  await checkMonthlyReset(userId);
  
  const result = await trackStockView(userId, ticker);
  return result.success;
}

// Check if user's views need to be reset at the end of the month
async function checkMonthlyReset(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Get the user's last reset date
    const { data, error } = await supabase
      .from('user_stock_views')
      .select('last_reset_at')
      .eq('user_id', userId)
      .order('last_reset_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error checking last reset date:', error);
      return;
    }
    
    const now = new Date();
    let shouldReset = false;
    
    // If we have a last reset date, check if it's from a previous month
    if (data && data.length > 0) {
      const lastResetDate = new Date(data[0].last_reset_at);
      
      // Check if the last reset was in a different month or year
      shouldReset = 
        lastResetDate.getMonth() !== now.getMonth() || 
        lastResetDate.getFullYear() !== now.getFullYear();
    }
    
    // If no reset date found or it's from a previous month, reset the views
    if (shouldReset || !data || data.length === 0) {
      await resetAuthenticatedViews(userId);
    }
  } catch (error) {
    console.error('Error in monthly reset check:', error);
  }
}

// Reset authenticated user's views
async function resetAuthenticatedViews(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Delete all the user's view records
    const { error: deleteError } = await supabase
      .from('user_stock_views')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error resetting user views:', deleteError);
    }
    
    console.log(`Reset views for user ${userId} at the end of the month`);
  } catch (error) {
    console.error('Error resetting authenticated views:', error);
  }
}

// Check if user has reached view limit and track the view if not
export async function checkViewLimit(userId: string | null, ticker: string): Promise<boolean> {
  // For authenticated users
  if (userId) {
    const views = await getAuthenticatedViews(userId);
    
    // If user has already viewed this stock, don't count it against their limit
    if (views.includes(ticker)) {
      return false;
    }
    
    // If user has reached their limit
    if (views.length >= AUTHENTICATED_VIEW_LIMIT) {
      return true;
    }
    
    // Track the view
    await trackAuthenticatedView(userId, ticker);
    return false;
  } 
  // For anonymous users
  else {
    const views = getAnonymousViews();
    
    // If user has already viewed this stock, don't count it against their limit
    if (views[ticker]) {
      return false;
    }
    
    // If user has reached their limit
    const viewCount = Object.keys(views).length;
    if (viewCount >= ANONYMOUS_VIEW_LIMIT) {
      return true;
    }
    
    // Track the view
    trackAnonymousView(ticker);
    return false;
  }
}

// Get remaining views for a user
export async function getRemainingViews(userId: string | null): Promise<number> {
  if (userId) {
    const views = await getAuthenticatedViews(userId);
    return Math.max(0, AUTHENTICATED_VIEW_LIMIT - views.length);
  } else {
    const views = getAnonymousViews();
    return Math.max(0, ANONYMOUS_VIEW_LIMIT - Object.keys(views).length);
  }
}

// Get total view limit for a user
export function getTotalViewLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? AUTHENTICATED_VIEW_LIMIT : ANONYMOUS_VIEW_LIMIT;
} 