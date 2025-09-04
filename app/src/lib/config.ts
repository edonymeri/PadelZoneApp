// Runtime environment configuration & validation

type EnvShape = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
};

function readEnv(): EnvShape {
  const required: (keyof EnvShape)[] = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing: string[] = [];
  const out: any = {};
  for (const key of required) {
    const value = import.meta.env[key];
    if (!value) missing.push(key);
    out[key] = value;
  }
  if (missing.length) {
    // Throwing early prevents silent misconfiguration
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return out as EnvShape;
}

const env = readEnv();

export const CONFIG = {
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },
};
