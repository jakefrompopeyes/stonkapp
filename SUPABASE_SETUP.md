# Supabase Integration Guide

This guide explains how to set up and use Supabase with the Stonkapp application.

## What is Supabase?

[Supabase](https://supabase.io/) is an open-source Firebase alternative that provides:
- PostgreSQL database
- Authentication
- Real-time subscriptions
- Storage
- Functions
- And more

## Setup Steps

### 1. Create a Supabase Account and Project

1. Go to [supabase.com](https://supabase.com/) and sign up for an account
2. Create a new project
3. Note your project URL and anon key (public API key)

### 2. Configure Environment Variables

Add your Supabase credentials to the `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Database Tables

In the Supabase dashboard, go to the SQL Editor and run the following SQL to create the necessary tables:

```sql
-- Create insider trading table
CREATE TABLE insider_trading (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  share NUMERIC,
  change NUMERIC,
  filingDate TEXT,
  transactionDate TEXT,
  transactionCode TEXT,
  transactionPrice NUMERIC,
  isDerivative BOOLEAN DEFAULT FALSE,
  currency TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_insider_trading_symbol ON insider_trading(symbol);
```

### 4. Migrate Existing Data (Optional)

If you have existing insider trading data, you can migrate it to Supabase using the provided script:

```bash
cd frontend
npx ts-node src/scripts/migrateToSupabase.ts
```

Make sure to update the list of tickers in the script before running it.

## Using Supabase in the Application

The application is already set up to use Supabase for insider trading data. The integration works as follows:

1. When fetching insider trading data, the app first tries to get it from Supabase
2. If no data is found in Supabase, it falls back to the original API
3. You can use the utility functions in `src/lib/supabaseUtils.ts` for common operations

## Authentication (Optional)

If you want to add user authentication:

1. Configure authentication providers in the Supabase dashboard
2. Use the authentication functions in `src/lib/supabaseUtils.ts`
3. Create protected routes in your application

## Deployment

When deploying to Vercel:

1. Add your Supabase environment variables in the Vercel dashboard
2. Make sure your Supabase project allows requests from your deployed domain

## Troubleshooting

- If you encounter CORS issues, add your frontend URL to the allowed origins in the Supabase dashboard
- Check the browser console for detailed error messages
- Verify your environment variables are correctly set

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/introduction)
- [Next.js with Supabase Auth Helpers](https://github.com/supabase/auth-helpers) 