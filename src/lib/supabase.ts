import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let initPromise: Promise<{ ok: boolean, error?: string }> | null = null;

export const initSupabase = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // Try to fetch with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch('/api/env', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const env = await res.json();
      
      if (env.supabaseUrl && env.supabaseAnonKey) {
        // Clean URL: trim whitespace and quotes, remove trailing slashes and /rest/v1
        let url = env.supabaseUrl.trim().replace(/^["'](.+)["']$/, '$1').replace(/\/$/, '');
        const key = env.supabaseAnonKey.trim().replace(/^["'](.+)["']$/, '$1');

        if (url.endsWith('/rest/v1')) {
          url = url.replace(/\/rest\/v1$/, '');
        }

        // Check for common placeholders or dashboard URL
        if (
          url.includes('YOUR_SUPABASE_URL') || 
          url.includes('PLACEHOLDER') ||
          !url.startsWith('http') ||
          url.includes('app.supabase.com') ||
          key.includes('YOUR_SUPABASE_ANON_KEY')
        ) {
          return { ok: false, error: url.includes('app.supabase.com') ? 'DASHBOARD_URL' : 'CONFIG_PLACEHOLDER' };
        }
        
        try {
          new URL(url);
        } catch (e) {
          return { ok: false, error: 'INVALID_URL' };
        }
        
        if (!supabase) {
          supabase = createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storageKey: 'e-surat-tu-auth-token'
            }
          });
        }
        return { ok: true };
      } else {
        return { ok: false, error: 'MISSING_CONFIG' };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("Supabase config fetch timed out");
      } else {
        console.warn("Supabase config fetch failed:", error.message);
      }
      return { ok: false, error: 'FETCH_FAILED' };
    }
  })();

  return initPromise;
};

export const getSupabase = () => supabase;
