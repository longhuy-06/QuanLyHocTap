
export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export enum Priority {
  HIGH = 'Cao',
  MEDIUM = 'Trung bình',
  LOW = 'Thấp',
}

// Added missing Task interface
export interface Task {
  id: string;
  title: string;
  subjectId: string;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
  completed: boolean;
  progress: number;
  completedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  subjectId: string;
}

export interface StudyDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64
  subjectId: string;
  groupId?: string; // ID của nhóm (nếu có)
  uploadDate: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  subjectId: string;
  cards: {
    id: string;
    front: string;
    back: string;
  }[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string; // Changed to string for persistent storage
  isError?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isPremium: boolean;
  streak: number;
  lastCompletedDate: string | null;
  studySessions: Record<string, number>;
  status?: string; // Ví dụ: "Sinh viên", "Lớp 12",...
}
