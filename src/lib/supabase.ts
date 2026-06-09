import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let initialized = false;

export const initSupabase = async () => {
  if (initialized) return { ok: true };
  
  try {
    const res = await fetch('/api/env');
    const env = await res.json();
    
    if (env.supabaseUrl && env.supabaseAnonKey) {
      if (env.supabaseUrl.includes('YOUR_SUPABASE_URL') || !env.supabaseUrl.startsWith('http')) {
        return { ok: false, error: 'CONFIG_PLACEHOLDER' };
      }
      try {
        new URL(env.supabaseUrl);
      } catch (e) {
        return { ok: false, error: 'INVALID_URL' };
      }
      
      supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
      initialized = true;
      return { ok: true };
    } else {
      console.warn("Supabase credentials not found in env");
      return { ok: false, error: 'MISSING_CONFIG' };
    }
  } catch (error) {
    console.error("Failed to fetch Supabase config", error);
    return { ok: false, error: 'FETCH_FAILED' };
  }
};

export const getSupabase = () => supabase;
