import axios from 'axios';
import { supabase } from './supabase';

// We'll keep this for backward compatibility, but we'll primarily use Supabase
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getServerStatus = async (): Promise<string> => {
  try {
    // Try to connect to Supabase instead of the backend API
    const { data, error } = await supabase.from('insider_trading').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    return 'Connected to Supabase';
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return 'Error connecting to server';
  }
};

export default api; 