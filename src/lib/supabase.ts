import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Will hold the initialized client
let supabase: SupabaseClient | null = null;

export const initSupabase = async () => {
  if (supabase) return true;

  try {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key || !url.startsWith('http')) {
      const res = await fetch('/api/env');
      if (res.ok) {
        const data = await res.json();
        url = data.supabaseUrl || url;
        key = data.supabaseAnonKey || key;
      }
    }

    if (url && key) {
      try {
        const validUrl = new URL(url);
        if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
          supabase = createClient(url, key);
          return true;
        }
      } catch (e) {
        console.error("Invalid Supabase URL:", url);
      }
    }
  } catch (e) {
    console.error("Failed to fetch Supabase config", e);
  }
  return false;
};

export const getSupabase = () => supabase;
