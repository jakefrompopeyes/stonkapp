# Deploying to Vercel

This guide explains how to deploy your Stonkapp application to Vercel.

## Prerequisites

Before deploying, make sure you have:
- Your code pushed to a GitHub repository
- Supabase project set up and configured
- Environment variables ready

## Step 1: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com/) and sign up for an account
2. You can sign up using your GitHub account for easier integration

## Step 2: Import Your GitHub Repository

1. Once logged in to Vercel, click on "Add New..." and select "Project"
2. Connect your GitHub account if you haven't already
3. Select the "stonkapp" repository from the list
4. Vercel will automatically detect that you're using Next.js

## Step 3: Configure Project Settings

1. **Project Name**: You can keep the default name or choose a custom one
2. **Framework Preset**: Vercel should automatically detect Next.js
3. **Root Directory**: If your frontend is in a subdirectory, specify `frontend`
4. **Build Command**: Keep the default (`next build`)
5. **Output Directory**: Keep the default (`.next`)

## Step 4: Configure Environment Variables

Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://skmllawzddrnfjwzoaze.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbWxsYXd6ZGRybmZqd3pvYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NjI4NDksImV4cCI6MjA1NjEzODg0OX0.rslAR876PSBes7VGR0tcx1IHjJPVTfZtIZ8FckJRe_0
```

## Step 5: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Once completed, you'll receive a URL for your deployed application (e.g., `stonkapp.vercel.app`)

## Step 6: Configure Supabase for Production

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "URL Configuration"
3. Add your Vercel deployment URL to the list of allowed redirect URLs and site URLs
4. This ensures that your deployed application can communicate with Supabase

## Step 7: Set Up Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add your custom domain and follow the instructions to configure DNS settings

## Continuous Deployment

Vercel automatically sets up continuous deployment:
- Every push to your main branch will trigger a new deployment
- You can also set up preview deployments for pull requests

## Troubleshooting

If you encounter issues:

1. **Build Errors**: Check the build logs in Vercel for specific errors
2. **API Connection Issues**: Verify your environment variables are correctly set
3. **CORS Errors**: Make sure your Supabase project allows requests from your Vercel domain
4. **Missing Dependencies**: Ensure all dependencies are properly listed in package.json

## Monitoring and Analytics

Vercel provides:
- Deployment analytics
- Performance monitoring
- Error tracking

Access these features from your Vercel dashboard. 