import { supabase } from './supabase';

// Example function to fetch data from a table
export async function fetchFromTable(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
  
  return data;
}

// Example function to insert data into a table
export async function insertIntoTable(tableName: string, data: any) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();
  
  if (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
  
  return result;
}

// Example function to update data in a table
export async function updateInTable(tableName: string, id: number, data: any) {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating data:', error);
    throw error;
  }
  
  return result;
}

// Example function to delete data from a table
export async function deleteFromTable(tableName: string, id: number) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
  
  return true;
}

// Example function for authentication - sign up
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }
  
  return data;
}

// Example function for authentication - sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }
  
  return data;
}

// Function for authentication - sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
  
  return data;
}

// Example function for authentication - sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  return true;
}

// Example function to get the current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Function to get the current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  return data.session;
}

// Example function to store insider trading data
export async function storeInsiderTrading(data: any) {
  return insertIntoTable('insider_trading', data);
}

// Example function to fetch insider trading data
export async function fetchInsiderTrading(ticker: string) {
  const { data, error } = await supabase
    .from('insider_trading')
    .select('*')
    .eq('symbol', ticker);
  
  if (error) {
    console.error('Error fetching insider trading data:', error);
    throw error;
  }
  
  return data;
} 