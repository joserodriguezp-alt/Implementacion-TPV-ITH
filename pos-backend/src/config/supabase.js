import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import ws from 'ws';

// Cliente con service_role para operaciones privilegiadas del backend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});
