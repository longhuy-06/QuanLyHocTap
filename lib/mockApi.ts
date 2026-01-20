
import { UserProfile } from '../types';
import { LoginFormValues, RegisterFormValues } from './validators/auth';

// Key để lưu trong LocalStorage
const DB_KEY = 'softstudy_users_db';

// Interface cho đối tượng User lưu trong DB (bao gồm password)
interface DBUser extends UserProfile {
  password: string; // Trong thực tế, password phải được hash
}

// Hàm helper để lấy data từ LocalStorage
const getDbUsers = (): DBUser[] => {
  const usersJson = localStorage.getItem(DB_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Hàm helper để lưu data vào LocalStorage
const saveDbUsers = (users: DBUser[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

// Giả lập độ trễ mạng
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (credentials: LoginFormValues): Promise<UserProfile> => {
  await delay(800); // Fake network latency

  const users = getDbUsers();
  const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  // Trả về thông tin user (loại bỏ password)
  const { password, ...userProfile } = user;
  
  // Migration: Nếu user cũ chưa có field streak, thêm vào mặc định
  if (userProfile.streak === undefined) {
      userProfile.streak = 0;
      userProfile.lastCompletedDate = null;
  }
  
  return userProfile;
};

export const register = async (data: RegisterFormValues): Promise<UserProfile> => {
  await delay(1000);

  const users = getDbUsers();
  
  // Kiểm tra email tồn tại
  if (users.some(u => u.email === data.email)) {
    throw new Error('Email này đã được sử dụng');
  }

  const newUser: DBUser = {
    id: Date.now().toString(),
    name: data.name,
    email: data.email,
    password: data.password,
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.name}`, // Tạo avatar ngẫu nhiên
    isPremium: false,
    streak: 0,
    lastCompletedDate: null,
    studySessions: {}
  };

  users.push(newUser);
  saveDbUsers(users);

  const { password, ...userProfile } = newUser;
  return userProfile;
};
