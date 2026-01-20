
import { create } from 'zustand';
import { Task, TaskStatus, Subject, FlashcardSet, StudyDocument, DocumentGroup, ChatMessage } from '../../types';
import { supabase } from '../supabase';
import { useAuthStore, getTodayLocalISO, normalizeToISO } from './authStore';

interface DataState {
  tasks: Task[];
  subjects: Subject[];
  documentGroups: DocumentGroup[];
  documents: StudyDocument[];
  flashcardSets: FlashcardSet[];
  chatMessages: ChatMessage[];
  isSyncing: boolean;
  hasShownStreakSuccessToday: string | null;
  
  fetchUserData: (userId: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  setSubjects: (subjects: Subject[]) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  addDocumentGroup: (group: DocumentGroup) => Promise<void>;
  deleteDocumentGroup: (groupId: string) => Promise<void>;
  addDocument: (doc: StudyDocument) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  setStreakShownToday: (date: string) => void;
  setWelcomeStreakShownToday: (date: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  tasks: JSON.parse(localStorage.getItem('softstudy_tasks') || '[]'),
  subjects: JSON.parse(localStorage.getItem('softstudy_subjects') || '[]'),
  documentGroups: [],
  documents: [],
  flashcardSets: [],
  chatMessages: [],
  isSyncing: false,
  hasShownStreakSuccessToday: localStorage.getItem('softstudy_streak_shown_date'),

  fetchUserData: async (userId) => {
    set({ isSyncing: true });
    try {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('subjects').select('*').eq('user_id', userId)
      ]);
      if (t) set({ tasks: t });
      if (s) set({ subjects: s });
    } finally {
      set({ isSyncing: false });
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const isDone = status === TaskStatus.DONE;
    const updates = { 
        status, 
        completed: isDone, 
        completed_at: isDone ? new Date().toISOString() : null 
    };

    const updatedTasks = get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    set({ tasks: updatedTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(updatedTasks));

    if (navigator.onLine) {
        await supabase.from('tasks').update(updates).eq('id', taskId);

        // LOGIC STREAK
        const todayISO = getTodayLocalISO(); // "YYYY-MM-DD"
        
        // Lọc những nhiệm vụ có hạn chót là hôm nay
        const todayTasks = updatedTasks.filter(t => {
            if (!t.due_date) return false;
            // Chuyển "20/01/2026 19:45" thành "2026-01-20"
            const taskISO = normalizeToISO(t.due_date);
            return taskISO === todayISO;
        });
        
        console.log(`[DATA] Kiểm tra hoàn thành ngày ${todayISO}: ${todayTasks.length} nhiệm vụ.`);

        if (todayTasks.length > 0) {
            const allCompleted = todayTasks.every(t => t.status === TaskStatus.DONE);
            if (allCompleted) {
                console.log("[DATA] Đã xong 100% nhiệm vụ hôm nay. Gọi hàm tăng Streak...");
                const { incrementStreak } = useAuthStore.getState();
                await incrementStreak();
            }
        }
    }
  },

  addTask: async (task) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const t = { ...task, user_id: user.id };
    set({ tasks: [t, ...get().tasks] });
    await supabase.from('tasks').insert([t]);
  },

  updateTaskProgress: async (taskId, progress) => {
    set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, progress } : t) });
    await supabase.from('tasks').update({ progress }).eq('id', taskId);
  },

  updateTask: async (taskId, updates) => {
    set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) });
    await supabase.from('tasks').update(updates).eq('id', taskId);
  },

  deleteTask: async (taskId) => {
    set({ tasks: get().tasks.filter(t => t.id !== taskId) });
    await supabase.from('tasks').delete().eq('id', taskId);
  },

  clearAllTasks: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ tasks: [] });
    await supabase.from('tasks').delete().eq('user_id', user.id);
  },

  setSubjects: async (subjects) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const s = subjects.map(it => ({ ...it, user_id: user.id }));
    set({ subjects: s });
    await supabase.from('subjects').upsert(s);
  },

  addSubject: async (subject) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const s = { ...subject, user_id: user.id };
    set({ subjects: [...get().subjects, s] });
    await supabase.from('subjects').insert([s]);
  },

  deleteSubject: async (subjectId) => {
    set({ subjects: get().subjects.filter(s => s.id !== subjectId) });
    await supabase.from('subjects').delete().eq('id', subjectId);
  },

  addDocumentGroup: async (group) => {},
  deleteDocumentGroup: async (groupId) => {},
  addDocument: async (doc) => {},
  deleteDocument: async (docId) => {},
  addChatMessage: (msg) => {},
  clearChatMessages: () => {},
  setStreakShownToday: (date) => {
    set({ hasShownStreakSuccessToday: date });
    localStorage.setItem('softstudy_streak_shown_date', date);
  },
  setWelcomeStreakShownToday: (date) => {
    localStorage.setItem('softstudy_welcome_streak_date', date);
  },
}));
