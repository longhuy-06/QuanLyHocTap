
import { create } from 'zustand';
import { UserProfile, Task, TaskStatus } from '../../types';
import { LoginFormValues, RegisterFormValues } from '../validators/auth';
import { supabase } from '../supabase';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (data: LoginFormValues) => Promise<void>;
  register: (data: RegisterFormValues) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Streak Actions
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  checkStreakValidity: (tasks: Task[]) => Promise<void>;
  
  // Time Tracking
  trackStudyTime: (minutes: number) => void;
  
  // Session Init
  initSession: () => Promise<void>;
}

/**
 * Lấy ngày hôm nay định dạng YYYY-MM-DD
 */
export const getTodayLocalISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Lấy ngày hôm qua định dạng YYYY-MM-DD
 */
export const getYesterdayLocalISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Chuyển đổi chuỗi "DD/MM/YYYY HH:mm" từ DB sang "YYYY-MM-DD" để so sánh chuẩn
 */
export const normalizeToISO = (vnDateStr: string) => {
    if (!vnDateStr) return null;
    const [datePart] = vnDateStr.split(' ');
    const parts = datePart.split('/');
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          set({ user: profile, isAuthenticated: true });
        }
      }
    } catch (e) {
      console.error("Init session failed", e);
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (authError) throw authError;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      if (profileError) throw profileError;
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Đăng nhập thất bại', isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });
      if (authError) throw authError;
      if (authData.session) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
        if (profile) set({ user: profile, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: "Vui lòng xác nhận email." });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  updateProfile: async (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
  },

  incrementStreak: async () => {
      const { user } = get();
      if (!user) return;
      
      const todayISO = getTodayLocalISO();
      const yesterdayISO = getYesterdayLocalISO();
      
      // Truy vấn DB để lấy dữ liệu thực tế nhất
      const { data: dbProfile } = await supabase
          .from('profiles')
          .select('streak, last_completed_date')
          .eq('id', user.id)
          .single();

      if (!dbProfile) return;

      // Nếu hôm nay đã ghi nhận hoàn thành rồi thì không làm gì cả
      if (dbProfile.last_completed_date === todayISO) {
          console.log("[STREAK] Hôm nay đã ghi nhận hoàn thành.");
          return;
      }

      let newStreak = 0;
      const currentStreak = Number(dbProfile.streak) || 0;

      // LOGIC YÊU CẦU: 
      // Nếu hôm qua cũng hoàn thành (chuỗi liên tục) -> Tăng +1
      // Nếu hôm qua không hoàn thành (đã bị reset hoặc mới bắt đầu) -> Giữ 0 để mai mới tăng
      if (dbProfile.last_completed_date === yesterdayISO) {
          newStreak = currentStreak + 1;
          console.log(`[STREAK] Chuỗi liên tục! Tăng từ ${currentStreak} lên ${newStreak}`);
      } else {
          newStreak = 0; 
          console.log("[STREAK] Ngày học lại đầu tiên. Giữ chuỗi 0, ngày mai hoàn thành sẽ bắt đầu tăng lên 1.");
      }
      
      const { error } = await supabase
          .from('profiles')
          .update({ 
              streak: newStreak, 
              last_completed_date: todayISO 
          })
          .eq('id', user.id);
      
      if (!error) {
          set({ user: { ...user, streak: newStreak, last_completed_date: todayISO } });
          console.log("[STREAK] Cập nhật thành công vào Database.");
      } else {
          console.error("[STREAK] Lỗi cập nhật Database:", error);
      }
  },

  resetStreak: async () => {
      const { user } = get();
      if (!user || user.streak === 0) return;

      console.log("[STREAK] RESET: Phát hiện vi phạm chuỗi.");
      const { error } = await supabase
          .from('profiles')
          .update({ streak: 0 })
          .eq('id', user.id);

      if (!error) {
          set({ user: { ...user, streak: 0 } });
      }
  },

  checkStreakValidity: async (tasks: Task[]) => {
      const { user } = get();
      if (!user) return;

      const todayISO = getTodayLocalISO();
      const yesterdayISO = getYesterdayLocalISO();
      const last = user.last_completed_date; // Định dạng YYYY-MM-DD

      // 1. Kiểm tra nếu bỏ lỡ ngày (ngày xong cuối cùng cũ hơn hôm qua)
      if (last && last !== todayISO && last !== yesterdayISO && user.streak > 0) {
          console.log("[STREAK] Bạn đã bỏ lỡ ngày học hôm qua.");
          await get().resetStreak();
          return;
      }

      // 2. Kiểm tra nếu có nhiệm vụ quá hạn (hạn trước hôm nay) mà chưa xong
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const hasUnfinishedOverdueTask = tasks.some(t => {
          if (t.status === TaskStatus.DONE) return false;
          const isoDate = normalizeToISO(t.due_date);
          if (!isoDate) return false;
          return new Date(isoDate) < now;
      });

      if (hasUnfinishedOverdueTask && user.streak > 0) {
          console.log("[STREAK] Phát hiện nhiệm vụ chưa hoàn thành từ những ngày trước.");
          await get().resetStreak();
      }
  },

  trackStudyTime: (minutes: number) => {
      const { user } = get();
      if (!user) return;
      const today = getTodayLocalISO();
      const sessions = { ...user.study_sessions } || {};
      sessions[today] = (sessions[today] || 0) + minutes;
      get().updateProfile({ study_sessions: sessions });
  }
}));
