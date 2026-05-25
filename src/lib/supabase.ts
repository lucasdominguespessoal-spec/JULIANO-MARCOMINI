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

const rawUrl = envUrl || 'https://ejztgxzmwutphlzxqmba.supabase.co/rest/v1/';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, ''); // Strip rest/v1 suffix if it exists
const finalAnonKey = anonKey || 'sb_publishable_CXGCH-4vO45tavB2MEdPGQ_cZY9kHDG';

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
export const SUPABASE_BOOTSTRAP_SQL = `-- =========================================================================
-- SCRIPT DE CRIAÇÃO E CONFIGURAÇÃO DA BASE DE DADOS DO SUPABASE
-- Execute este script no "SQL Editor" do seu painel Supabase.
-- =========================================================================

-- 1. TABELA DE SINCRONIZAÇÃO EM DOCUMENTOS (KEY-VALUE ENGINE)
-- Mantida ativa para compatibilidade instantânea com o sistema de sincronização atual.
CREATE TABLE IF NOT EXISTS athlete_sync (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ativar segurança para athlete_sync
ALTER TABLE athlete_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública livre" ON athlete_sync;
DROP POLICY IF EXISTS "Escrita pública livre" ON athlete_sync;
DROP POLICY IF EXISTS "Atualização pública livre" ON athlete_sync;

CREATE POLICY "Leitura pública livre" ON athlete_sync FOR SELECT USING (true);
CREATE POLICY "Escrita pública livre" ON athlete_sync FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública livre" ON athlete_sync FOR UPDATE USING (true);


-- 2. SCHEMAS RELACIONAIS DE ALTA ASSINATURA (MODERNIZADOS E ESTRUTURADOS)
-- Ideal para relatórios de Business Intelligence (BI), cruzamento de dados e consultas SQL puras.

-- 2.1 Tabela de Usuários (Treinadores e Atletas)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '1234',
  role TEXT NOT NULL CHECK (role IN ('COACH', 'ATHLETE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Tabela de Planilhas de Treino (Macroestrutura por Aluno)
CREATE TABLE IF NOT EXISTS planilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'Corrida de Rua',
  valid_until DATE,
  objective TEXT,
  macrocycle_focus TEXT,
  zones_config JSONB,   -- Configuração em JSON de faixas de ritmo/Zonas (Z1 a Z5)
  weeks_data JSONB,     -- Lista estruturada de atividades semanais detalhadas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Registro Simples de Progresso e Conclusão diária
CREATE TABLE IF NOT EXISTS workout_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL, -- Identificador de progresso como 'W1D1', 'W2D3'
  warmup_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (warmup_status IN ('PENDENTE', 'CONCLUÍDO', 'ADAPTADO')),
  main_set_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (main_set_status IN ('PENDENTE', 'CONCLUÍDO', 'ADAPTADO')),
  cooldown_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (cooldown_status IN ('PENDENTE', 'CONCLUÍDO', 'ADAPTADO')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, day_key)
);

-- 2.4 Feedbacks de Treinos e Avaliações de Percepção Subjetiva de Esforço (PSE)
CREATE TABLE IF NOT EXISTS workout_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
  week_index INT NOT NULL,
  day_index INT NOT NULL,
  rating_effort INT CHECK (rating_effort BETWEEN 1 AND 10), -- Fadiga/Esforço Borg Adaptado
  feeling TEXT, -- Sensação: 'ótimo', 'cansado', 'lesionado', etc.
  comments TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, week_index, day_index)
);

-- 2.5 Registro de Atividades Completadas (Logs de GPS / Corridas de Rua)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT,
  workout_date DATE DEFAULT CURRENT_DATE,
  distance_km NUMERIC(5, 2),
  duration_seconds INT,
  cadence INT,
  heart_rate INT,
  elevation_gain INT,
  telemetry_stream JSONB, -- Histórico de pulsações por segundo para análise gráfica
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. ESPECIFICAÇÕES DE SEGURANÇA (ROW LEVEL SECURITY)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE planilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Criação de Políticas de Demonstração (Permissivas para facilidade inicial)
DROP POLICY IF EXISTS "Acesso público livre users" ON app_users;
CREATE POLICY "Acesso público livre users" ON app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público livre planilhas" ON planilhas;
CREATE POLICY "Acesso público livre planilhas" ON planilhas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público livre workout_states" ON workout_states;
CREATE POLICY "Acesso público livre workout_states" ON workout_states FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público livre workout_feedbacks" ON workout_feedbacks;
CREATE POLICY "Acesso público livre workout_feedbacks" ON workout_feedbacks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público livre activity_logs" ON activity_logs;
CREATE POLICY "Acesso público livre activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);


-- 4. CARGA INICIAL DE REGISTROS (COUT & SEED DATA)
-- Registra os usuários base para que a sincronização relacional possa funcionar no Supabase.
INSERT INTO app_users (id, name, phone, password, role) VALUES
  ('treinador', 'TREINADOR', '0', '1234', 'COACH'),
  ('lucas', 'LUCAS DOMINGUES', '1', '1234', 'ATHLETE'),
  ('gustavo', 'GUSTAVO HENRIQUE (ALFA)', '2', '1234', 'ATHLETE'),
  ('mariana', 'MARIANA COSTA (BETA)', '3', '1234', 'ATHLETE'),
  ('paula', 'PAULA ALBUQUERQUE (DELTA)', '4', '1234', 'ATHLETE')
ON CONFLICT (id) DO NOTHING;
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
