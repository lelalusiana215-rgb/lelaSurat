import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Will hold the initialized client
let supabase: SupabaseClient | null = null;

export const initSupabase = async () => {
  if (supabase) return true;

  try {
    const res = await fetch('/api/env');
    if (!res.ok) return false;
    const { supabaseUrl, supabaseAnonKey } = await res.json();

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const validUrl = new URL(supabaseUrl);
        if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
          supabase = createClient(supabaseUrl, supabaseAnonKey);
          return true;
        }
      } catch (e) {
        console.error("Invalid Supabase URL:", supabaseUrl);
      }
    }
  } catch (e) {
    console.error("Failed to fetch Supabase config");
  }
  return false;
};

export const getSupabase = () => supabase;
