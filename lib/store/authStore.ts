
import { create } from 'zustand';
import { UserProfile, Task, TaskStatus } from '../../types';
import { login, register } from '../mockApi';
import { LoginFormValues, RegisterFormValues } from '../validators/auth';

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
}

const getInitialUser = (): UserProfile | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    const usersJson = localStorage.getItem('softstudy_users_db');
    if (!usersJson) return null;
    
    const users = JSON.parse(usersJson);
    const userId = token.replace('mock_token_', '');
    const user = users.find((u: any) => u.id === userId);
    
    if (user) {
        const { password, ...profile } = user;
        return profile;
    }
    return null;
};

const initialUser = getInitialUser();

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
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: false,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await login(data);
      localStorage.setItem('auth_token', 'mock_token_' + user.id);
      
      if (!user.studySessions) user.studySessions = {};
      if (!user.status) user.status = "Sinh viên";

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Đăng nhập thất bại', isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await register(data);
      localStorage.setItem('auth_token', 'mock_token_' + user.id);
      user.studySessions = {};
      user.status = "Sinh viên";
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Đăng ký thất bại', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  updateProfile: (updates) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...updates };
      
      const usersJson = localStorage.getItem('softstudy_users_db');
      if (usersJson) {
          const users = JSON.parse(usersJson);
          const index = users.findIndex((u: any) => u.id === user.id);
          if (index !== -1) {
              users[index] = { ...users[index], ...updates };
              localStorage.setItem('softstudy_users_db', JSON.stringify(users));
          }
      }
      
      set({ user: updatedUser });
    }
  },

  incrementStreak: () => {
      const { user } = get();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      if (user.lastCompletedDate !== today) {
          get().updateProfile({ streak: user.streak + 1, lastCompletedDate: today });
      }
  },

  checkStreakValidity: (tasks: Task[]) => {
      const { user } = get();
      if (!user) return;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Kiểm tra nếu đã quá 1 ngày kể từ lần hoàn thành cuối (bỏ lỡ cả ngày)
      if (user.lastCompletedDate) {
          const lastDate = new Date(user.lastCompletedDate);
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

      // 2. Kiểm tra các nhiệm vụ quá hạn từ những ngày TRƯỚC
      // Nếu có bất kỳ nhiệm vụ nào của ngày hôm qua hoặc cũ hơn mà CHƯA XONG
      const hasUnfinishedOverdue = tasks.some(t => {
          if (t.status === TaskStatus.DONE || !t.dueDate) return false;
          const taskDate = parseTaskDate(t.dueDate);
          if (!taskDate) return false;

          // Chỉ tính những nhiệm vụ thuộc về các ngày TRƯỚC ngày hôm nay
          const isFromPreviousDay = taskDate.getTime() < todayStart.getTime();
          return isFromPreviousDay;
      });

      if (hasUnfinishedOverdue && user.streak > 0) {
          get().updateProfile({ streak: 0 });
      }
  },

  trackStudyTime: (minutes: number) => {
      const { user } = get();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const currentSessions = { ...user.studySessions } || {};
      currentSessions[today] = (currentSessions[today] || 0) + minutes;
      get().updateProfile({ studySessions: currentSessions });
  }
}));
