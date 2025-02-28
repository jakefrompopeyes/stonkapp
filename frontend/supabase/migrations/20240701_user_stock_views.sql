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