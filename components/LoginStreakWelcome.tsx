
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store/authStore';
import { useDataStore } from '../lib/store/dataStore';

export const LoginStreakWelcome: React.FC = () => {
    const { user, isAuthenticated } = useAuthStore();
    const { hasShownWelcomeStreakToday, setWelcomeStreakShownToday } = useDataStore();
    const [isVisible, setIsVisible] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        // Chỉ hiển thị khi đã đăng nhập và chưa hiển thị trong ngày hôm nay
        if (isAuthenticated && user && hasShownWelcomeStreakToday !== today) {
            // Delay một chút để Dashboard load mượt
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, hasShownWelcomeStreakToday, today]);

    const handleConfirm = () => {
        setIsVisible(false);
        setWelcomeStreakShownToday(today);
    };

    if (!isVisible || !user) return null;

    const streak = user.streak || 0;
    
    // Tùy biến thông điệp dựa trên số ngày chuỗi
    const getEncouragement = () => {
        if (streak === 0) return "Hãy bắt đầu chuỗi ngày học tập rực cháy ngay hôm nay nhé!";
        if (streak < 3) return "Bạn đang làm rất tốt! Hãy duy trì ngọn lửa này.";
        if (streak < 7) return "Tuyệt vời! Bạn đã duy trì được gần một tuần rồi đó.";
        return "Bạn là một chiến binh thực thụ! Đừng để ngọn lửa này lụi tàn.";
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative border border-white/20 animate-fade-in-up">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 opacity-10"></div>
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
                
                <div className="p-8 flex flex-col items-center text-center relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-orange-400 to-rose-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-rose-500/30 mb-6 transform rotate-6 animate-pulse">
                        <span className="material-symbols-outlined text-white text-[56px] fill-1">local_fire_department</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trạng thái hiện tại</span>
                    </div>

                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Chuỗi của bạn</h2>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter">{streak}</span>
                        <span className="text-xl font-black text-orange-500 uppercase">Ngày</span>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-10 px-4">
                        {getEncouragement()} <br/>
                        <span className="font-bold text-gray-900 dark:text-white mt-2 block italic">"Cố gắng giữ chuỗi nhé bạn!"</span>
                    </p>

                    <button 
                        onClick={handleConfirm}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[24px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                        <span>Xác nhận quyết tâm</span>
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                    </button>
                    
                    <button 
                        onClick={handleConfirm}
                        className="mt-6 text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-widest transition-colors"
                    >
                        Bỏ qua và vào học ngay
                    </button>
                </div>
            </div>
        </div>
    );
};
