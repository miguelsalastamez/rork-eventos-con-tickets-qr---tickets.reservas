import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qaiaigeskomvqvcvgobo.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ZPA_pYdnkoZ9l6RecVFZ0Q_KnLj61Ms';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
