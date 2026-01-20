
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elwqqvbwfgcjcijjnhnm.supabase.co';
const supabaseAnonKey = 'sb_publishable_dx8B_s9ODUYJw5Tbp_GRog_xMUnWqhT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
