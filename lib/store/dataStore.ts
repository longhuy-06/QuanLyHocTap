
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
  
  // Task Actions
  addTask: (task: Task) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  
  // Subject Actions
  setSubjects: (subjects: Subject[]) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  
  // Document Actions
  addDocumentGroup: (group: DocumentGroup) => Promise<void>;
  deleteDocumentGroup: (groupId: string) => Promise<void>;
  addDocument: (doc: StudyDocument) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  
  // Flashcard Actions
  addFlashcardSet: (set: FlashcardSet) => void;
  deleteFlashcardSet: (setId: string) => void;
  
  // UI Actions
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
      const [
        { data: t }, 
        { data: s }, 
        { data: dg }, 
        { data: d },
        { data: fs }
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('subjects').select('*').eq('user_id', userId),
        supabase.from('document_groups').select('*').eq('user_id', userId),
        supabase.from('documents').select('*').eq('user_id', userId),
        supabase.from('flashcard_sets').select('*').eq('user_id', userId)
      ]);
      
      if (t) set({ tasks: t });
      if (s) set({ subjects: s });
      if (dg) set({ documentGroups: dg });
      if (d) set({ documents: d });
      if (fs) set({ flashcardSets: fs });
      
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
        const todayISO = getTodayLocalISO();
        const todayTasks = updatedTasks.filter(t => t.due_date && normalizeToISO(t.due_date) === todayISO);
        
        if (todayTasks.length > 0) {
            const allCompleted = todayTasks.every(t => t.status === TaskStatus.DONE);
            if (allCompleted) {
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

  // --- DOCUMENT LOGIC ---
  addDocumentGroup: async (group) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const g = { ...group, user_id: user.id };
    set({ documentGroups: [...get().documentGroups, g] });
    await supabase.from('document_groups').insert([g]);
  },

  deleteDocumentGroup: async (groupId) => {
    set({ documentGroups: get().documentGroups.filter(g => g.id !== groupId) });
    await supabase.from('document_groups').delete().eq('id', groupId);
  },

  addDocument: async (doc) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const d = { ...doc, user_id: user.id };
    set({ documents: [d, ...get().documents] });
    await supabase.from('documents').insert([d]);
  },

  deleteDocument: async (docId) => {
    set({ documents: get().documents.filter(d => d.id !== docId) });
    await supabase.from('documents').delete().eq('id', docId);
  },

  // --- FLASHCARD LOGIC ---
  addFlashcardSet: async (setObj) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const s = { ...setObj, user_id: user.id };
    set({ flashcardSets: [s, ...get().flashcardSets] });
    await supabase.from('flashcard_sets').insert([s]);
  },

  deleteFlashcardSet: async (setId) => {
    set({ flashcardSets: get().flashcardSets.filter(s => s.id !== setId) });
    await supabase.from('flashcard_sets').delete().eq('id', setId);
  },

  addChatMessage: (msg) => {
    set({ chatMessages: [...get().chatMessages, msg] });
  },

  clearChatMessages: () => {
    set({ chatMessages: [] });
  },

  setStreakShownToday: (date) => {
    set({ hasShownStreakSuccessToday: date });
    localStorage.setItem('softstudy_streak_shown_date', date);
  },

  setWelcomeStreakShownToday: (date) => {
    set({ hasShownWelcomeStreakToday: date } as any);
    localStorage.setItem('softstudy_welcome_streak_date', date);
  },
}));
