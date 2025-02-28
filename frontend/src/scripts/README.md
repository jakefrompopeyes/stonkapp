# StonkApp Database Scripts

This directory contains scripts to help manage the StonkApp database.

## Fixing the "user_stock_views" Table Issue

If you're seeing the error: `Error: relation "public.user_stock_views" does not exist`, it means the table for tracking stock views doesn't exist in your Supabase database.

### Option 1: Using the Supabase SQL Editor (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `create_user_stock_views.sql` from this directory
4. Paste it into the SQL Editor and run it
5. Refresh your application

### Option 2: Using the Node.js Scripts

These scripts require the Supabase service role key, which has admin privileges.

#### Prerequisites

1. Make sure you have Node.js installed
2. Create a `.env.local` file in the root of your project with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

#### Installation

```bash
cd frontend/src/scripts
npm install
```

#### Running the Scripts

To create the user_stock_views table:

```bash
npm run create-views-table
```

To apply the migration file:

```bash
npm run apply-migration
```

## Verifying the Fix

After running either option, you should no longer see the error. You can verify by:

1. Refreshing your application
2. Clicking the "Debug Views" button in the ViewCounter component
3. Checking that the error is gone and views are being tracked correctly 