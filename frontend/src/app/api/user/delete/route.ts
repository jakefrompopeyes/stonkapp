import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase admin client if keys are available
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request: NextRequest) {
  // Check if required services are initialized
  if (!supabaseAdmin) {
    console.error('Missing required environment variables for user deletion');
    return NextResponse.json(
      { error: 'Service configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  try {
    // Get the request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete the user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user account' },
      { status: 500 }
    );
  }
} 