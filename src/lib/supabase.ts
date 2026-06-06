import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let isValidUrl = false;
try {
  if (supabaseUrl) {
    new URL(supabaseUrl);
    isValidUrl = true;
  }
} catch (e) {
  // Invalid URL
}

export const supabase = isValidUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
