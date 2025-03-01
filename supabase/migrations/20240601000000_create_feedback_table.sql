-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('comment', 'complaint')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Add RLS policies
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert feedback
CREATE POLICY "Anonymous users can insert feedback" ON public.feedback
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Only allow admins to view all feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
    ));

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Only admins can update feedback
CREATE POLICY "Admins can update feedback" ON public.feedback
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_app_meta_data->>'is_admin' = 'true'
    ));

-- Grant permissions
GRANT SELECT, INSERT ON public.feedback TO anon, authenticated;
GRANT UPDATE ON public.feedback TO authenticated; 