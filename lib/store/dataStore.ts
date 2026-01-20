
import { create } from 'zustand';
import { Task, TaskStatus, Subject, FlashcardSet, StudyDocument, DocumentGroup, ChatMessage } from '../../types';

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:mm
  emailSummary: boolean;
  emailSummaryTime: string; // HH:mm
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
  hasShownStreakSuccessToday: string | null; // Lưu ngày đã hiển thị (YYYY-MM-DD)
  hasShownWelcomeStreakToday: string | null; // Ngày hiển thị lời chào chuỗi khi mới vào app
  
  setOnlineStatus: (status: boolean) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  clearAllTasks: () => void;
  
  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;

  addDocumentGroup: (group: DocumentGroup) => void;
  deleteDocumentGroup: (groupId: string) => void;
  
  addDocument: (doc: StudyDocument) => void;
  deleteDocument: (docId: string) => void;

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

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'chinese', name: 'Tiếng Trung', color: '#ef4444' }
];

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: '19:00',
  emailSummary: true,
  emailSummaryTime: '21:00'
};

const saveTasks = (tasks: Task[]) => localStorage.setItem('softstudy_tasks', JSON.stringify(tasks));
const saveChat = (msgs: ChatMessage[]) => localStorage.setItem('softstudy_chat_history', JSON.stringify(msgs));

export const useDataStore = create<DataState>((set, get) => ({
  tasks: JSON.parse(localStorage.getItem('softstudy_tasks') || '[]'),
  subjects: JSON.parse(localStorage.getItem('softstudy_subjects') || '[]').length > 0 
    ? JSON.parse(localStorage.getItem('softstudy_subjects') || '[]') 
    : DEFAULT_SUBJECTS,
  documentGroups: JSON.parse(localStorage.getItem('softstudy_doc_groups') || '[]'),
  documents: JSON.parse(localStorage.getItem('softstudy_docs') || '[]'),
  flashcardSets: [],
  // Fix: Explicitly type the initial chat message array to ChatMessage[] to satisfy the role union type requirement.
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
  
  addTask: (task) => set((state) => {
    const newTasks = [task, ...state.tasks];
    saveTasks(newTasks);
    return { tasks: newTasks };
  }),
  updateTaskStatus: (taskId, status) => set((state) => {
    const newTasks = state.tasks.map(t => t.id === taskId ? { ...t, status, completed: status === TaskStatus.DONE, completedAt: status === TaskStatus.DONE ? new Date().toISOString() : undefined } : t);
    saveTasks(newTasks);
    return { tasks: newTasks };
  }),
  updateTaskProgress: (taskId, progress) => set((state) => {
    const newTasks = state.tasks.map(t => t.id === taskId ? { ...t, progress: Math.max(0, Math.min(100, progress)) } : t);
    saveTasks(newTasks);
    return { tasks: newTasks };
  }),
  updateTask: (taskId, updates) => set((state) => {
    const newTasks = state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    saveTasks(newTasks);
    return { tasks: newTasks };
  }),
  deleteTask: (taskId) => set((state) => {
    const newTasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks(newTasks);
    return { tasks: newTasks };
  }),
  clearAllTasks: () => {
    localStorage.removeItem('softstudy_tasks');
    set({ tasks: [] });
  },
  
  setSubjects: (subjects) => {
      const finalSubjects = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
      localStorage.setItem('softstudy_subjects', JSON.stringify(finalSubjects));
      set({ subjects: finalSubjects });
  },
  addSubject: (subject) => set((state) => {
      const newSubjects = [...state.subjects, subject];
      localStorage.setItem('softstudy_subjects', JSON.stringify(newSubjects));
      return { subjects: newSubjects };
  }),
  deleteSubject: (subjectId) => set((state) => {
    const newSubjects = state.subjects.filter(s => s.id !== subjectId);
    localStorage.setItem('softstudy_subjects', JSON.stringify(newSubjects));
    return {
      subjects: newSubjects,
      tasks: state.tasks.filter(t => t.subjectId !== subjectId),
      documents: state.documents.filter(d => d.subjectId !== subjectId),
      documentGroups: state.documentGroups.filter(g => g.subjectId !== subjectId)
    };
  }),

  addDocumentGroup: (group) => set((state) => {
      const newGroups = [...state.documentGroups, group];
      localStorage.setItem('softstudy_doc_groups', JSON.stringify(newGroups));
      return { documentGroups: newGroups };
  }),
  deleteDocumentGroup: (groupId) => set((state) => {
      const newGroups = state.documentGroups.filter(g => g.id !== groupId);
      localStorage.setItem('softstudy_doc_groups', JSON.stringify(newGroups));
      return { 
          documentGroups: newGroups,
          documents: state.documents.map(d => d.groupId === groupId ? { ...d, groupId: undefined } : d)
      };
  }),
  
  addDocument: (doc) => set((state) => {
      const newDocs = [doc, ...state.documents];
      localStorage.setItem('softstudy_docs', JSON.stringify(newDocs));
      return { documents: newDocs };
  }),
  deleteDocument: (docId) => set((state) => {
      const newDocs = state.documents.filter(d => d.id !== docId);
      localStorage.setItem('softstudy_docs', JSON.stringify(newDocs));
      return { documents: newDocs };
  }),

  addFlashcardSet: (setObj) => set((state) => ({ flashcardSets: [setObj, ...state.flashcardSets] })),
  deleteFlashcardSet: (id) => set((state) => ({ flashcardSets: state.flashcardSets.filter(s => s.id !== id) })),
  
  addChatMessage: (msg) => set((state) => {
    const newChat = [...state.chatMessages, msg];
    saveChat(newChat);
    return { chatMessages: newChat };
  }),
  // Fix: Explicitly type the resetChat array to ChatMessage[] to ensure role is correctly typed as 'model' | 'user' instead of string.
  clearChatMessages: () => {
    const resetChat: ChatMessage[] = [{ id: '1', role: 'model', text: 'Chào bạn! Mình là Huy Long. Bạn cần giúp gì hôm nay?', timestamp: new Date().toISOString() }];
    saveChat(resetChat);
    set({ chatMessages: resetChat });
  },

  updateQuickNote: (note) => {
    localStorage.setItem('softstudy_quick_note', note);
    set({ quickNote: note });
  },
  toggleNotification: (key) => set((state) => {
    const newSettings = { ...state.notificationSettings, [key]: !state.notificationSettings[key] };
    localStorage.setItem('softstudy_notification_settings', JSON.stringify(newSettings));
    return { notificationSettings: newSettings };
  }),
  updateNotificationTime: (key, time) => set((state) => {
    const newSettings = { ...state.notificationSettings, [key]: time };
    localStorage.setItem('softstudy_notification_settings', JSON.stringify(newSettings));
    return { notificationSettings: newSettings };
  }),
  setStreakShownToday: (date) => {
    localStorage.setItem('softstudy_streak_shown_date', date);
    set({ hasShownStreakSuccessToday: date });
  },
  setWelcomeStreakShownToday: (date) => {
    localStorage.setItem('softstudy_welcome_streak_date', date);
    set({ hasShownWelcomeStreakToday: date });
  }
}));
