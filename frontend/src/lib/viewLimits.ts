import { getUserStockViews, trackStockView, getUserProfile } from './supabaseClient';
import { supabase } from './supabase';

// Constants for view limits
export const ANONYMOUS_VIEW_LIMIT = 2;
export const AUTHENTICATED_VIEW_LIMIT = 3;
export const PRO_VIEW_LIMIT = 25;
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
  
  console.log(`Getting authenticated views for user ${userId}`);
  
  // Check if we need to reset views at the end of the month
  await checkMonthlyReset(userId);
  
  const views = await getUserStockViews(userId);
  console.log(`Retrieved ${views.length} views for user ${userId}:`, views);
  return views.map(view => view.ticker);
}

export async function trackAuthenticatedView(userId: string, ticker: string): Promise<boolean> {
  if (!userId) return false;
  
  console.log(`Attempting to track view for user ${userId} and ticker ${ticker}`);
  
  // Check if we need to reset views at the end of the month
  await checkMonthlyReset(userId);
  
  const result = await trackStockView(userId, ticker);
  console.log('Track stock view result:', result);
  return result.success;
}

// Check if user's views need to be reset at the end of the month
async function checkMonthlyReset(userId: string): Promise<void> {
  if (!userId) return;
  
  console.log(`Checking monthly reset for user ${userId}`);
  
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
    
    console.log(`Last reset data:`, data);
    
    const now = new Date();
    let shouldReset = false;
    
    // If we have a last reset date, check if it's from a previous month
    if (data && data.length > 0) {
      const lastResetDate = new Date(data[0].last_reset_at);
      
      // Check if the last reset was in a different month or year
      shouldReset = 
        lastResetDate.getMonth() !== now.getMonth() || 
        lastResetDate.getFullYear() !== now.getFullYear();
      
      console.log(`Last reset date: ${lastResetDate.toISOString()}, Current date: ${now.toISOString()}, Should reset: ${shouldReset}`);
    } else {
      console.log(`No reset date found for user ${userId}`);
    }
    
    // If no reset date found or it's from a previous month, reset the views
    if (shouldReset || !data || data.length === 0) {
      console.log(`Resetting views for user ${userId}`);
      await resetAuthenticatedViews(userId);
    } else {
      console.log(`No need to reset views for user ${userId}`);
    }
  } catch (error) {
    console.error('Error in monthly reset check:', error);
  }
}

// Reset authenticated user's views
async function resetAuthenticatedViews(userId: string): Promise<void> {
  if (!userId) return;
  
  console.log(`Resetting authenticated views for user ${userId}`);
  
  try {
    // Delete all the user's view records
    const { error: deleteError } = await supabase
      .from('user_stock_views')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error resetting user views:', deleteError);
    } else {
      console.log(`Successfully reset views for user ${userId}`);
    }
  } catch (error) {
    console.error('Error resetting authenticated views:', error);
  }
}

// Check if user has premium subscription
export async function hasUnlimitedViews(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) return false;
    
    // Check if user has an active premium subscription (only premium tier has unlimited views)
    return (
      profile.subscription_status === 'active' && 
      profile.subscription_tier === 'premium'
    );
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

// Check if user has pro subscription
export async function hasProSubscription(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) return false;
    
    // Check if user has an active pro subscription
    return (
      profile.subscription_status === 'active' && 
      profile.subscription_tier === 'pro'
    );
  } catch (error) {
    console.error('Error checking pro status:', error);
    return false;
  }
}

// Check if user has reached view limit and track the view if not
export async function checkViewLimit(userId: string | null, ticker: string): Promise<boolean> {
  console.log(`checkViewLimit called for ${userId ? 'user ' + userId : 'anonymous user'} and ticker ${ticker}`);
  
  // For authenticated users
  if (userId) {
    try {
      // Check if user has premium subscription with unlimited views
      const hasUnlimited = await hasUnlimitedViews(userId);
      console.log(`User ${userId} has unlimited views: ${hasUnlimited}`);
      
      if (hasUnlimited) {
        // Premium users can view unlimited stocks without tracking
        return false;
      }
      
      // Check if user has pro subscription with 25 views
      const hasPro = await hasProSubscription(userId);
      console.log(`User ${userId} has pro subscription: ${hasPro}`);
      
      // Get current views
      const views = await getAuthenticatedViews(userId);
      console.log(`User ${userId} has viewed these stocks:`, views);
      
      // If user has already viewed this stock, don't count it against their limit
      if (views.includes(ticker)) {
        console.log(`User ${userId} has already viewed ${ticker}, not counting against limit`);
        return false;
      }
      
      // If user has reached their limit (based on subscription)
      const viewLimit = hasPro ? PRO_VIEW_LIMIT : AUTHENTICATED_VIEW_LIMIT;
      if (views.length >= viewLimit) {
        console.log(`User ${userId} has reached view limit (${views.length}/${viewLimit})`);
        return true;
      }
      
      // Track the view - use direct Supabase insert for reliability
      console.log(`Tracking view for user ${userId} and ticker ${ticker}`);
      
      // Try direct insert first
      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('user_stock_views')
          .insert({
            user_id: userId,
            ticker: ticker,
            viewed_at: now,
            last_reset_at: now
          });
        
        if (error) {
          console.error('Direct insert error:', error);
          // Fall back to the helper function
          const tracked = await trackAuthenticatedView(userId, ticker);
          console.log(`View tracked using helper function: ${tracked}`);
        } else {
          console.log(`View tracked successfully using direct insert`);
        }
      } catch (e) {
        console.error('Exception during direct insert:', e);
        // Fall back to the helper function
        const tracked = await trackAuthenticatedView(userId, ticker);
        console.log(`View tracked using helper function after exception: ${tracked}`);
      }
      
      return false;
    } catch (error) {
      console.error('Error in checkViewLimit for authenticated user:', error);
      // If there's an error, don't block the user from viewing
      return false;
    }
  } 
  // For anonymous users
  else {
    try {
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
    } catch (error) {
      console.error('Error in checkViewLimit for anonymous user:', error);
      // If there's an error, don't block the user from viewing
      return false;
    }
  }
}

// Get remaining views for a user
export async function getRemainingViews(userId: string | null): Promise<number> {
  console.log(`getRemainingViews called for ${userId ? 'user ' + userId : 'anonymous user'}`);
  
  // For authenticated users
  if (userId) {
    try {
      // Check if user has premium subscription with unlimited views
      const hasUnlimited = await hasUnlimitedViews(userId);
      console.log(`User ${userId} has unlimited views: ${hasUnlimited}`);
      
      if (hasUnlimited) {
        // Premium users have unlimited views
        return Infinity;
      }
      
      // Check if user has pro subscription with 25 views
      const hasPro = await hasProSubscription(userId);
      console.log(`User ${userId} has pro subscription: ${hasPro}`);
      
      if (hasPro) {
        // Get current views for pro users
        const views = await getAuthenticatedViews(userId);
        console.log(`Pro user ${userId} has viewed ${views.length} stocks`);
        return Math.max(0, PRO_VIEW_LIMIT - views.length);
      }
      
      // For regular authenticated users
      const views = await getAuthenticatedViews(userId);
      console.log(`Regular user ${userId} has viewed ${views.length} stocks`);
      return Math.max(0, AUTHENTICATED_VIEW_LIMIT - views.length);
    } catch (error) {
      console.error('Error in getRemainingViews for authenticated user:', error);
      return AUTHENTICATED_VIEW_LIMIT; // Default to max views if there's an error
    }
  } 
  // For anonymous users
  else {
    try {
      const views = getAnonymousViews();
      const viewCount = Object.keys(views).length;
      return Math.max(0, ANONYMOUS_VIEW_LIMIT - viewCount);
    } catch (error) {
      console.error('Error in getRemainingViews for anonymous user:', error);
      return ANONYMOUS_VIEW_LIMIT; // Default to max views if there's an error
    }
  }
}

// Get total view limit for a user (async version that checks subscription)
export async function getUserViewLimit(userId: string | null): Promise<number> {
  if (!userId) return ANONYMOUS_VIEW_LIMIT;
  
  try {
    // Check if user has premium subscription with unlimited views
    const hasUnlimited = await hasUnlimitedViews(userId);
    if (hasUnlimited) {
      return Infinity;
    }
    
    // Check if user has pro subscription with 25 views
    const hasPro = await hasProSubscription(userId);
    if (hasPro) {
      return PRO_VIEW_LIMIT;
    }
    
    // Regular authenticated users
    return AUTHENTICATED_VIEW_LIMIT;
  } catch (error) {
    console.error('Error in getUserViewLimit:', error);
    return AUTHENTICATED_VIEW_LIMIT; // Default to authenticated limit if there's an error
  }
}

// Legacy function for backward compatibility (sync version)
export function getTotalViewLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? AUTHENTICATED_VIEW_LIMIT : ANONYMOUS_VIEW_LIMIT;
} 