import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'civiclens_supabase_url';
const STORAGE_KEY_ANON_KEY = 'civiclens_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let currentClientKey: string = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL as string || '').trim();
  const envKey = (
    (metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
    (metaEnv.VITE_SUPABASE_ANON_KEY as string) ||
    ''
  ).trim();

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  const localUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
  const localKey = (localStorage.getItem(STORAGE_KEY_ANON_KEY) || '').trim();

  if (localUrl && localKey) {
    return {
      url: localUrl,
      anonKey: localKey,
      isConfigured: true,
      source: 'storage',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
  cachedClient = null;
  currentClientKey = '';
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON_KEY);
  cachedClient = null;
  currentClientKey = '';
};

export const getSupabase = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const keySignature = `${config.url}:::${config.anonKey}`;
  if (cachedClient && currentClientKey === keySignature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientKey = keySignature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are missing. Please configure them first.',
    };
  }

  try {
    // Attempt a light query on civic_reports or check server response
    const { error } = await client.from('civic_reports').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return {
          success: false,
          message: 'Connected to Supabase project, but the "civic_reports" table is missing. Run the SQL schema script in your Supabase SQL editor.',
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase and verified the "civic_reports" table!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to reach Supabase endpoint.',
    };
  }
};
