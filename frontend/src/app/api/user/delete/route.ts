import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
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