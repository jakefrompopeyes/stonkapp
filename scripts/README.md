# StonkApp Utility Scripts

This directory contains utility scripts for managing StonkApp.

## Give Pro Access Script

This script allows you to give a user pro access by updating their profile in the Supabase database.

### Prerequisites

1. Make sure you have Node.js installed on your machine.
2. Create a `.env` file in the `scripts` directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   > **Important**: The service role key has admin privileges, so keep it secure and never expose it in client-side code.

### Installation

1. Navigate to the scripts directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Usage

To give a user pro access, run:

```
npm run give-pro -- <user_id>
```

Replace `<user_id>` with the actual UUID of the user you want to give pro access to.

Example:
```
npm run give-pro -- 123e4567-e89b-12d3-a456-426614174000
```

### What the Script Does

The script performs the following actions:

1. Checks if the user exists in the Supabase auth.users table
2. Checks if the user has a profile in the profiles table
3. If the profile exists, it updates the subscription_status to 'active' and subscription_tier to 'pro'
4. If the profile doesn't exist, it creates a new profile with pro access

### Troubleshooting

If you encounter any issues:

1. Make sure your `.env` file contains the correct Supabase URL and service role key
2. Verify that the user ID exists in your Supabase auth.users table
3. Check the Supabase logs for any errors related to the operation 