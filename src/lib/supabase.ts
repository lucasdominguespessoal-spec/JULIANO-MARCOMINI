import { createClient } from '@supabase/supabase-js';

// Safely resolve the environment variables with full fallback structures
let envUrl = '';
let anonKey = '';

try {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (e) {
  console.warn("Could not read import.meta.env safely on host environment:", e);
}

const rawUrl = envUrl || 'https://kgmnvjhyuhpxglpsvpnz.supabase.co/rest/v1/';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, ''); // Strip rest/v1 suffix if it exists
const finalAnonKey = anonKey || 'sb_publishable_PETS7v3HtnOzOlobv2z3QQ_v61zppLl';

// Export clean URL so other components can access it fail-safe
export const supabaseUrl = cleanUrl;

let supabaseClient: any;
try {
  // Try initializing with the parsed keys
  if (!cleanUrl || !finalAnonKey) {
    throw new Error("Missing Supabase configuration keys");
  }
  supabaseClient = createClient(cleanUrl, finalAnonKey);
} catch (error) {
  console.error("Supabase fail-safe mode activated due to initialization failure:", error);
  // Create solid fallback mock client that perfectly emulates basic queries to prevent crash
  supabaseClient = {
    from: () => ({
      upsert: async () => ({ error: null }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null })
        })
      })
    })
  };
}

// Export the guarded client instance
export const supabase = supabaseClient;

// Useful copyable SQL snippet to help users bootstrap their DB tables
export const SUPABASE_BOOTSTRAP_SQL = `-- Comando para criar a tabela de sincronização no painel SQL do Supabase:
CREATE TABLE IF NOT EXISTS athlete_sync (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ativar acesso público de leitura/escrita para demonstração (ou configure RLS se preferir)
ALTER TABLE athlete_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública livre" ON athlete_sync FOR SELECT USING (true);
CREATE POLICY "Escrita pública livre" ON athlete_sync FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública livre" ON athlete_sync FOR UPDATE USING (true);
`;

/**
 * Robust Sync Helper to save any key-value state to Supabase.
 * Falls back to localStorage on any database, network, or relation error.
 */
export async function saveStateToCloud(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  // Always save locally first as durable fallback
  localStorage.setItem(key, JSON.stringify(value));

  try {
    // Attempt upsert in Supabase
    const { error } = await supabase
      .from('athlete_sync')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.warn(`[Supabase Store Fallback] Erro ao salvar "${key}":`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase Network Fallback] Falha de conexão ao salvar "${key}":`, err);
    return { success: false, error: err.message || 'Erro de rede ou conexão' };
  }
}

/**
 * Robust Sync Helper to fetch a key-value state from Supabase.
 * If fetching fails, returns the cached localStorage valuation.
 */
export async function getStateFromCloud<T>(key: string, defaultValue: T): Promise<{ data: T; source: 'supabase' | 'local' | 'default'; error?: string }> {
  // Obtain local storage cache
  let localData: T | null = null;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      localData = JSON.parse(cached);
    } catch (_) {}
  }

  try {
    const { data, error } = await supabase
      .from('athlete_sync')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // e.g. 42P01: relation "athlete_sync" does not exist
      return { 
        data: localData ?? defaultValue, 
        source: localData ? 'local' : 'default', 
        error: error.message 
      };
    }

    if (data && data.value !== undefined) {
      const parsedValue = data.value as T;
      // Sync local Cache with fetched data
      localStorage.setItem(key, JSON.stringify(parsedValue));
      return { data: parsedValue, source: 'supabase' };
    }

    // No record found, return local cache or default
    return { 
      data: localData ?? defaultValue, 
      source: localData ? 'local' : 'default' 
    };
  } catch (err: any) {
    return { 
      data: localData ?? defaultValue, 
      source: localData ? 'local' : 'default', 
      error: err.message || 'Falha de rede' 
    };
  }
}

/**
 * Force sync all items across localStorage and Supabase.
 */
export async function syncAllWithSupabase(keys: string[]): Promise<Record<string, { success: boolean; source: string; error?: string }>> {
  const results: Record<string, { success: boolean; source: string; error?: string }> = {};
  
  for (const key of keys) {
    const localStr = localStorage.getItem(key);
    if (!localStr) {
      // Key doesn't exist locally, try fetching from Supabase
      const fetched = await getStateFromCloud(key, null);
      results[key] = {
        success: !fetched.error,
        source: fetched.source,
        error: fetched.error
      };
    } else {
      // Key exists locally, push it up to Supabase to establish initial values or verify sync
      try {
        const parsed = JSON.parse(localStr);
        const res = await saveStateToCloud(key, parsed);
        results[key] = {
          success: res.success,
          source: res.success ? 'supabase' : 'local',
          error: res.error
        };
      } catch (e: any) {
        results[key] = { success: false, source: 'local', error: e.message };
      }
    }
  }

  return results;
}
