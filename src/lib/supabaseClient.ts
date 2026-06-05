import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Clean surrounding quotes and whitespace from env strings
const cleanEnvVar = (val: any): string => {
  if (typeof val !== 'string') return '';
  return val.replace(/^['"]|['"]$/g, '').trim();
};

const cleanedUrl = cleanEnvVar(supabaseUrl);
const cleanedKey = cleanEnvVar(supabaseAnonKey);

/**
 * Checks if the required environment variables are set in AI Studio secrets.
 */
export const hasSupabaseKeys = (): boolean => {
  if (!cleanedUrl || !cleanedKey) return false;
  // Ensure we have a valid HTTP or HTTPS URL to prevent supabase-js from exploding on boot
  try {
    const url = new URL(cleanedUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Safely retrieves the Supabase client. Returns null if keys are not configured yet,
 * preventing module-level load crashes.
 */
export const getSupabase = () => {
  if (!hasSupabaseKeys()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(cleanedUrl, cleanedKey);
  }
  return supabaseInstance;
};
