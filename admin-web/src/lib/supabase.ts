import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysjcifbfkjkumuldkjbo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX';

export const supabase = createClient(supabaseUrl, supabaseKey);
