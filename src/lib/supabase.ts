import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase Environment Variables!");
}

// We use the Service Role Key here because this file represents the trusted Server-Side API layer.
// This allows us to interact with the database without managing individual user Row Level Security (RLS) tokens.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});
