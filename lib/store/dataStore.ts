
import { create } from 'zustand';
import { Task, TaskStatus, Subject, FlashcardSet, StudyDocument, DocumentGroup, ChatMessage } from '../../types';
import { supabase } from '../supabase';

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  emailSummary: boolean;
  emailSummaryTime: string;
}

interface DataState {
  tasks: Task[];
  subjects: Subject[];
  documentGroups: DocumentGroup[];
  documents: StudyDocument[];
  flashcardSets: FlashcardSet[];
  chatMessages: ChatMessage[];
  quickNote: string;
  notificationSettings: NotificationSettings;
  isOnline: boolean;
  lastSynced: string | null;
  hasShownStreakSuccessToday: string | null;
  hasShownWelcomeStreakToday: string | null;
  
  setOnlineStatus: (status: boolean) => void;
  
  // Data Fetching
  fetchUserData: (userId: string) => Promise<void>;
  
  // Tasks
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  clearAllTasks: () => void;
  
  // Subjects
  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;

  // Groups & Docs
  addDocumentGroup: (group: DocumentGroup) => void;
  deleteDocumentGroup: (groupId: string) => void;
  addDocument: (doc: StudyDocument) => void;
  deleteDocument: (docId: string) => void;

  // Others
  addFlashcardSet: (set: FlashcardSet) => void;
  deleteFlashcardSet: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  updateQuickNote: (note: string) => void;
  toggleNotification: (key: keyof Pick<NotificationSettings, 'dailyReminder' | 'emailSummary'>) => void;
  updateNotificationTime: (key: keyof Pick<NotificationSettings, 'dailyReminderTime' | 'emailSummaryTime'>, time: string) => void;
  setStreakShownToday: (date: string) => void;
  setWelcomeStreakShownToday: (date: string) => void;
}

const DEFAULT_SUBJECTS: Subject[] = [{ id: 'chinese', name: 'Tiếng Trung', color: '#ef4444' }];
const DEFAULT_NOTIFICATIONS: NotificationSettings = { dailyReminder: true, dailyReminderTime: '19:00', emailSummary: true, emailSummaryTime: '21:00' };

export const useDataStore = create<DataState>((set, get) => ({
  tasks: JSON.parse(localStorage.getItem('softstudy_tasks') || '[]'),
  subjects: JSON.parse(localStorage.getItem('softstudy_subjects') || '[]').length > 0 ? JSON.parse(localStorage.getItem('softstudy_subjects') || '[]') : DEFAULT_SUBJECTS,
  documentGroups: JSON.parse(localStorage.getItem('softstudy_doc_groups') || '[]'),
  documents: JSON.parse(localStorage.getItem('softstudy_docs') || '[]'),
  flashcardSets: [],
  chatMessages: (JSON.parse(localStorage.getItem('softstudy_chat_history') || '[]').length > 0
    ? JSON.parse(localStorage.getItem('softstudy_chat_history') || '[]')
    : ([{ id: '1', role: 'model', text: 'Chào bạn! Mình là Huy Long. Bạn cần giúp gì hôm nay?', timestamp: new Date().toISOString() }] as ChatMessage[])),
  quickNote: localStorage.getItem('softstudy_quick_note') || '',
  notificationSettings: JSON.parse(localStorage.getItem('softstudy_notification_settings') || JSON.stringify(DEFAULT_NOTIFICATIONS)),
  isOnline: navigator.onLine,
  lastSynced: localStorage.getItem('softstudy_last_sync'),
  hasShownStreakSuccessToday: localStorage.getItem('softstudy_streak_shown_date'),
  hasShownWelcomeStreakToday: localStorage.getItem('softstudy_welcome_streak_date'),
  
  setOnlineStatus: (status) => set({ isOnline: status, lastSynced: status ? new Date().toISOString() : get().lastSynced }),

  fetchUserData: async (userId) => {
    if (!navigator.onLine) return;
    
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId);
    const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', userId);
    const { data: groups } = await supabase.from('document_groups').select('*').eq('user_id', userId);
    const { data: docs } = await supabase.from('documents').select('*').eq('user_id', userId);

    if (tasks) { set({ tasks }); localStorage.setItem('softstudy_tasks', JSON.stringify(tasks)); }
    if (subjects && subjects.length > 0) { set({ subjects }); localStorage.setItem('softstudy_subjects', JSON.stringify(subjects)); }
    if (groups) { set({ documentGroups: groups }); localStorage.setItem('softstudy_doc_groups', JSON.stringify(groups)); }
    if (docs) { set({ documents: docs }); localStorage.setItem('softstudy_docs', JSON.stringify(docs)); }
  },
  
  addTask: async (task) => {
    const newTasks = [task, ...get().tasks];
    set({ tasks: newTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(newTasks));
    
    if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('tasks').insert([{ ...task, user_id: user.id }]);
    }
  },

  updateTaskStatus: async (taskId, status) => {
    // Fix: Using completed_at
    const newTasks = get().tasks.map(t => t.id === taskId ? { ...t, status, completed: status === TaskStatus.DONE, completed_at: status === TaskStatus.DONE ? new Date().toISOString() : undefined } : t);
    set({ tasks: newTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(newTasks));
    
    if (navigator.onLine) {
        await supabase.from('tasks').update({ status, completed: status === TaskStatus.DONE }).eq('id', taskId);
    }
  },

  updateTaskProgress: async (taskId, progress) => {
    const newTasks = get().tasks.map(t => t.id === taskId ? { ...t, progress: Math.max(0, Math.min(100, progress)) } : t);
    set({ tasks: newTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(newTasks));
    
    if (navigator.onLine) {
        await supabase.from('tasks').update({ progress }).eq('id', taskId);
    }
  },

  updateTask: async (taskId, updates) => {
    const newTasks = get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    set({ tasks: newTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(newTasks));
    
    if (navigator.onLine) {
        await supabase.from('tasks').update(updates).eq('id', taskId);
    }
  },

  deleteTask: async (taskId) => {
    const newTasks = get().tasks.filter(t => t.id !== taskId);
    set({ tasks: newTasks });
    localStorage.setItem('softstudy_tasks', JSON.stringify(newTasks));
    
    if (navigator.onLine) {
        await supabase.from('tasks').delete().eq('id', taskId);
    }
  },

  clearAllTasks: async () => {
    set({ tasks: [] });
    localStorage.removeItem('softstudy_tasks');
    
    if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('tasks').delete().eq('user_id', user.id);
    }
  },
  
  setSubjects: async (subjects) => {
      const finalSubjects = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
      set({ subjects: finalSubjects });
      localStorage.setItem('softstudy_subjects', JSON.stringify(finalSubjects));
      
      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('subjects').delete().eq('user_id', user.id);
            await supabase.from('subjects').insert(finalSubjects.map(s => ({ ...s, user_id: user.id })));
        }
      }
  },

  addSubject: async (subject) => {
      const newSubjects = [...get().subjects, subject];
      set({ subjects: newSubjects });
      localStorage.setItem('softstudy_subjects', JSON.stringify(newSubjects));
      
      if (navigator.onLine) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('subjects').insert([{ ...subject, user_id: user.id }]);
      }
  },

  deleteSubject: async (subjectId) => {
    const newSubjects = get().subjects.filter(s => s.id !== subjectId);
    // Fix: Using subject_id for Task, StudyDocument and DocumentGroup to match interfaces
    set({ 
        subjects: newSubjects,
        tasks: get().tasks.filter(t => t.subject_id !== subjectId),
        documents: get().documents.filter(d => d.subject_id !== subjectId),
        documentGroups: get().documentGroups.filter(g => g.subject_id !== subjectId)
    });
    localStorage.setItem('softstudy_subjects', JSON.stringify(newSubjects));

    if (navigator.onLine) {
        await supabase.from('subjects').delete().eq('id', subjectId);
        await supabase.from('tasks').delete().eq('subject_id', subjectId);
        await supabase.from('documents').delete().eq('subject_id', subjectId);
        await supabase.from('document_groups').delete().eq('subject_id', subjectId);
    }
  },

  addDocumentGroup: async (group) => {
      const newGroups = [...get().documentGroups, group];
      set({ documentGroups: newGroups });
      localStorage.setItem('softstudy_doc_groups', JSON.stringify(newGroups));

      if (navigator.onLine) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('document_groups').insert([{ ...group, user_id: user.id }]);
      }
  },

  deleteDocumentGroup: async (groupId) => {
      const newGroups = get().documentGroups.filter(g => g.id !== groupId);
      set({ 
          documentGroups: newGroups,
          // Fix: Using group_id
          documents: get().documents.map(d => d.group_id === groupId ? { ...d, group_id: undefined } : d)
      });
      localStorage.setItem('softstudy_doc_groups', JSON.stringify(newGroups));

      if (navigator.onLine) {
          await supabase.from('document_groups').delete().eq('id', groupId);
      }
  },
  
  addDocument: async (doc) => {
      const newDocs = [doc, ...get().documents];
      set({ documents: newDocs });
      localStorage.setItem('softstudy_docs', JSON.stringify(newDocs));

      if (navigator.onLine) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('documents').insert([{ ...doc, user_id: user.id }]);
      }
  },

  deleteDocument: async (docId) => {
      const newDocs = get().documents.filter(d => d.id !== docId);
      set({ documents: newDocs });
      localStorage.setItem('softstudy_docs', JSON.stringify(newDocs));

      if (navigator.onLine) {
          await supabase.from('documents').delete().eq('id', docId);
      }
  },

  addFlashcardSet: (setObj) => set((state) => ({ flashcardSets: [setObj, ...state.flashcardSets] })),
  deleteFlashcardSet: (id) => set((state) => ({ flashcardSets: state.flashcardSets.filter(s => s.id !== id) })),
  
  addChatMessage: (msg) => {
    const newChat = [...get().chatMessages, msg];
    set({ chatMessages: newChat });
    localStorage.setItem('softstudy_chat_history', JSON.stringify(newChat));
  },

  clearChatMessages: () => {
    const resetChat: ChatMessage[] = [{ id: '1', role: 'model', text: 'Chào bạn! Mình là Huy Long. Bạn cần giúp gì hôm nay?', timestamp: new Date().toISOString() }];
    set({ chatMessages: resetChat });
    localStorage.setItem('softstudy_chat_history', JSON.stringify(resetChat));
  },

  updateQuickNote: (note) => {
    set({ quickNote: note });
    localStorage.setItem('softstudy_quick_note', note);
  },

  toggleNotification: (key) => {
    const newSettings = { ...get().notificationSettings, [key]: !get().notificationSettings[key] };
    set({ notificationSettings: newSettings });
    localStorage.setItem('softstudy_notification_settings', JSON.stringify(newSettings));
  },

  updateNotificationTime: (key, time) => {
    const newSettings = { ...get().notificationSettings, [key]: time };
    set({ notificationSettings: newSettings });
    localStorage.setItem('softstudy_notification_settings', JSON.stringify(newSettings));
  },

  setStreakShownToday: (date) => {
    set({ hasShownStreakSuccessToday: date });
    localStorage.setItem('softstudy_streak_shown_date', date);
  },

  setWelcomeStreakShownToday: (date) => {
    set({ hasShownWelcomeStreakToday: date });
    localStorage.setItem('softstudy_welcome_streak_date', date);
  }
}));
