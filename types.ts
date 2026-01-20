
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

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  subject_id: string;
  priority: Priority;
  due_date: string;
  status: TaskStatus;
  completed: boolean;
  progress: number;
  completed_at?: string;
}

export interface Subject {
  id: string;
  user_id?: string;
  name: string;
  color: string;
}

export interface DocumentGroup {
  id: string;
  user_id?: string;
  name: string;
  subject_id: string;
}

export interface StudyDocument {
  id: string;
  user_id?: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string; // URL từ storage
  file_path?: string; // Đường dẫn vật lý trên storage để xóa
  subject_id: string;
  group_id?: string;
  upload_date: string;
}

export interface FlashcardSet {
  id: string;
  user_id?: string;
  title: string;
  subject_id: string;
  cards: {
    id: string;
    front: string;
    back: string;
  }[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  is_premium: boolean;
  streak: number;
  last_completed_date: string | null;
  study_sessions: Record<string, number>;
  status?: string;
}
