
import { createClient } from '@supabase/supabase-js';

import { CONFIG } from './config';

export const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

