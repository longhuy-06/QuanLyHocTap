
import { createClient } from '@supabase/supabase-js';

/**
 * CẤU HÌNH SUPABASE
 * 
 * Để ứng dụng chạy ổn định và không bị tạm dừng, bạn nên:
 * 1. Tạo dự án riêng tại https://supabase.com
 * 2. Lấy URL và Anon Key trong phần Settings -> API
 * 3. Thêm vào Netlify Environment Variables với tên:
 *    - VITE_SUPABASE_URL
 *    - VITE_SUPABASE_ANON_KEY
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://elwqqvbwfgcjcijjnhnm.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dx8B_s9ODUYJw5Tbp_GRog_xMUnWqhT';

// Khởi tạo client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
