
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
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Streak Actions
  incrementStreak: () => void;
  checkStreakValidity: (tasks: Task[]) => void;
  
  // Time Tracking
  trackStudyTime: (minutes: number) => void;
  
  // Session Init
  initSession: () => Promise<void>;
}

// Helper to parse "DD/MM/YYYY HH:mm"
const parseTaskDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [datePart, timePart] = dateStr.split(' ');
    const parts = datePart.split('/');
    if (parts.length === 3) {
        let hour = 23, minute = 59;
        if (timePart) {
            const [h, m] = timePart.split(':');
            hour = parseInt(h);
            minute = parseInt(m);
        }
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), hour, minute);
    }
    return null;
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
      const message = err.message || err.error_description || 'Đăng nhập thất bại';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Đăng ký tài khoản với name trong metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Không thể tạo người dùng");

      // Nếu Supabase có cấu hình xác thực email, session có thể chưa có ngay
      if (authData.session) {
        // Đợi 1 chút để Trigger hoàn thành việc tạo Profile trong database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profile) {
          set({ user: profile, isAuthenticated: true, isLoading: false });
        } else {
          // Fallback nếu trigger chậm
          const fallbackProfile: UserProfile = {
            id: authData.user.id,
            name: data.name,
            email: data.email,
            avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.name}`,
            is_premium: false,
            streak: 0,
            last_completed_date: null,
            study_sessions: {},
            status: "Sinh viên"
          };
          set({ user: fallbackProfile, isAuthenticated: true, isLoading: false });
        }
      } else {
        // Trường hợp cần xác thực email (Email Confirmation enabled)
        set({ 
          isLoading: false, 
          error: "Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập." 
        });
      }
    } catch (err: any) {
      console.error("Auth Store Register Error:", err);
      const message = err.message || err.error_description || 'Đăng ký thất bại';
      set({ error: message, isLoading: false });
      throw err;
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
      const updatedUser = { ...user, ...updates };
      set({ user: updatedUser });

      if (navigator.onLine) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      }
    }
  },

  incrementStreak: () => {
      const { user } = get();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      if (user.last_completed_date !== today) {
          get().updateProfile({ streak: user.streak + 1, last_completed_date: today });
      }
  },

  checkStreakValidity: (tasks: Task[]) => {
      const { user } = get();
      if (!user) return;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (user.last_completed_date) {
          const lastDate = new Date(user.last_completed_date);
          lastDate.setHours(0,0,0,0);
          
          const diffTime = todayStart.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 1) {
              if (user.streak > 0) {
                  get().updateProfile({ streak: 0 });
              }
              return;
          }
      }

      const hasUnfinishedOverdue = tasks.some(t => {
          if (t.status === TaskStatus.DONE || !t.due_date) return false;
          const taskDate = parseTaskDate(t.due_date);
          if (!taskDate) return false;
          return taskDate.getTime() < todayStart.getTime();
      });

      if (hasUnfinishedOverdue && user.streak > 0) {
          get().updateProfile({ streak: 0 });
      }
  },

  trackStudyTime: (minutes: number) => {
      const { user } = get();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const currentSessions = { ...user.study_sessions } || {};
      currentSessions[today] = (currentSessions[today] || 0) + minutes;
      get().updateProfile({ study_sessions: currentSessions });
  }
}));
