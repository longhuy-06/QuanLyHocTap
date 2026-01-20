import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Mock login
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background-light dark:bg-background-dark">
       <div className="w-full max-w-[420px] mx-auto relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 animate-fade-in-up">
             <div className="h-16 w-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-glow mb-4 text-white transform rotate-3">
                <span className="material-symbols-outlined text-[32px]">neurology</span>
             </div>
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-text-muted">Hệ thống AI đang hoạt động</span>
             </div>
          </div>

          {/* Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft p-8 border border-white/50 dark:border-gray-700 backdrop-blur-xl">
             <h1 className="text-2xl font-bold text-center mb-2 tracking-tight text-text-main dark:text-white">Đăng nhập vào tài khoản</h1>
             <p className="text-text-muted text-center text-sm mb-8">Chào mừng trở lại với không gian học tập của bạn</p>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center gap-2 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                   <span className="text-sm font-semibold">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                   <span className="text-sm font-semibold">Apple</span>
                </button>
             </div>

             <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-text-muted uppercase">Hoặc</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
             </div>

             <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <div className="space-y-1.5">
                   <label className="text-sm font-medium ml-1">Email</label>
                   <input className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-primary focus:border-primary" placeholder="name@example.com" type="email" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-sm font-medium ml-1">Mật khẩu</label>
                   <input className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-primary focus:border-primary" placeholder="••••••••" type="password" />
                </div>
                
                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-4">
                   <span>Đăng nhập</span>
                   <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};
