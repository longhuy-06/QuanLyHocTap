
import { create } from 'zustand';
import { Task, TaskStatus, Subject, FlashcardSet, StudyDocument, DocumentGroup, ChatMessage } from '../../types';
import { supabase } from '../supabase';
import { useAuthStore } from './authStore';

interface DataState {
  tasks: Task[];
  subjects: Subject[];
  documentGroups: DocumentGroup[];
  documents: StudyDocument[];
  flashcardSets: FlashcardSet[];
  chatMessages: ChatMessage[];
  isSyncing: boolean;
  isOnline: boolean;
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
  addDocument: (doc: StudyDocument, file?: File) => Promise<void>;
  deleteDocument: (docId: string, filePath?: string) => Promise<void>;
  
  // Flashcard Actions
  addFlashcardSet: (set: FlashcardSet) => void;
  deleteFlashcardSet: (setId: string) => void;
  
  // UI Actions
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  setStreakShownToday: (date: string) => void;
  setWelcomeStreakShownToday: (date: string) => void;
  setOnlineStatus: (status: boolean) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  tasks: [],
  subjects: [],
  documentGroups: [],
  documents: [],
  flashcardSets: [],
  chatMessages: [],
  isSyncing: false,
  isOnline: navigator.onLine,
  hasShownStreakSuccessToday: localStorage.getItem('softstudy_streak_shown_date'),

  fetchUserData: async (userId) => {
    if (!userId) return;
    set({ isSyncing: true });
    try {
      const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', userId);
      const { data: groups } = await supabase.from('document_groups').select('*').eq('user_id', userId);
      const { data: docs } = await supabase.from('documents').select('*').eq('user_id', userId).order('upload_date', { ascending: false });
      const { data: sets } = await supabase.from('flashcard_sets').select('*').eq('user_id', userId);

      set({ 
        tasks: tasks || [], 
        subjects: subjects || [], 
        documentGroups: groups || [], 
        documents: docs || [], 
        flashcardSets: sets || [] 
      });
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const isDone = status === TaskStatus.DONE;
    const isTodo = status === TaskStatus.TODO;
    
    let progress = get().tasks.find(t => t.id === taskId)?.progress || 0;
    if (isDone) progress = 100;
    else if (isTodo) progress = 0;

    const updates = { 
        status, 
        completed: isDone, 
        progress: progress,
        completed_at: isDone ? new Date().toISOString() : null 
    };

    set({ tasks: get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) });
    await supabase.from('tasks').update(updates).eq('id', taskId);
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
    const { user } = useAuthStore.getState();
    if (!user) return;
    const previousTasks = get().tasks;
    set({ tasks: previousTasks.filter(t => t.id !== taskId) });
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
    if (error) {
      set({ tasks: previousTasks });
      alert("Lỗi xóa nhiệm vụ!");
    }
  },

  clearAllTasks: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const previousTasks = get().tasks;
    set({ tasks: [] });
    const { error } = await supabase.from('tasks').delete().eq('user_id', user.id);
    if (error) {
      set({ tasks: previousTasks });
      alert("Lỗi khi xóa tất cả nhiệm vụ.");
    }
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

  addDocumentGroup: async (group) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const g = { ...group, user_id: user.id };
    await supabase.from('document_groups').insert([g]);
    set({ documentGroups: [...get().documentGroups, g] });
  },

  deleteDocumentGroup: async (groupId) => {
    await supabase.from('document_groups').delete().eq('id', groupId);
    set({ documentGroups: get().documentGroups.filter(g => g.id !== groupId) });
  },

  addDocument: async (doc, file) => {
    const { user } = useAuthStore.getState();
    if (!user || !file) return;
    try {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        await supabase.storage.from('study-documents').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('study-documents').getPublicUrl(filePath);
        const d = { ...doc, user_id: user.id, file_data: publicUrl, file_path: filePath };
        await supabase.from('documents').insert([d]);
        set({ documents: [d, ...get().documents] });
    } catch (err) {
        console.error("Upload failed:", err);
    }
  },

  deleteDocument: async (docId, filePath) => {
    await supabase.from('documents').delete().eq('id', docId);
    if (filePath) await supabase.storage.from('study-documents').remove([filePath]);
    set({ documents: get().documents.filter(d => d.id !== docId) });
  },

  addFlashcardSet: (setObj) => set({ flashcardSets: [setObj, ...get().flashcardSets] }),
  deleteFlashcardSet: (setId) => set({ flashcardSets: get().flashcardSets.filter(s => s.id !== setId) }),
  addChatMessage: (msg) => set({ chatMessages: [...get().chatMessages, msg] }),
  clearChatMessages: () => set({ chatMessages: [] }),
  setStreakShownToday: (date) => {
    set({ hasShownStreakSuccessToday: date });
    localStorage.setItem('softstudy_streak_shown_date', date);
  },
  setWelcomeStreakShownToday: (date) => {
    set({ hasShownWelcomeStreakToday: date } as any);
    localStorage.setItem('softstudy_welcome_streak_date', date);
  },
  setOnlineStatus: (status) => set({ isOnline: status }),
}));
