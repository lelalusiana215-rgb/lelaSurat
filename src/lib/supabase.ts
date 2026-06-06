import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let initialized = false;

export const initSupabase = async () => {
  if (initialized) return true;
  
  try {
    const res = await fetch('/api/env');
    const env = await res.json();
    
    if (env.supabaseUrl && env.supabaseAnonKey) {
      supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
      initialized = true;
      return true;
    } else {
      console.warn("Supabase credentials not found in env");
      return false;
    }
  } catch (error) {
    console.error("Failed to fetch Supabase config", error);
    return false;
  }
};

export const getSupabase = () => supabase;
