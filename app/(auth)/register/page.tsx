
import React from 'react';
import { RegisterForm } from '../../../components/auth/RegisterForm';
import { useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10% ] left-[-10%] w-[50%] aspect-square bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
           <div className="relative mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-primary to-indigo-600 rounded-[28px] flex items-center justify-center shadow-glow text-white transform -rotate-6 scale-110">
                 <span className="material-symbols-outlined text-[40px] font-bold">menu_book</span>
              </div>
              <div className="absolute -bottom-2 -left-2 h-10 w-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center text-primary transform rotate-12 border-4 border-background-light dark:border-background-dark">
                 <span className="material-symbols-outlined text-[20px] font-bold">auto_awesome</span>
              </div>
           </div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Học Tập</h1>
           <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">Bắt đầu hành trình mới</p>
        </div>

        <RegisterForm />

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          Đã có tài khoản?{' '}
          <button onClick={() => navigate('/login')} className="font-black text-primary hover:underline">
            Đăng nhập ngay
          </button>
        </div>
      </div>
      
      {/* Decorative Icon */}
      <div className="absolute top-10 left-10 opacity-5 pointer-events-none hidden lg:block">
          <span className="material-symbols-outlined text-[200px]">auto_stories</span>
      </div>
    </div>
  );
};
