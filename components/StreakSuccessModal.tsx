
import React, { useMemo, useEffect, useState } from 'react';
import { useDataStore } from '../lib/store/dataStore';
import { useAuthStore, getTodayLocalISO } from '../lib/store/authStore';

export const StreakSuccessModal: React.FC = () => {
    const { hasShownStreakSuccessToday, setStreakShownToday, tasks } = useDataStore();
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    // Ngày hôm nay theo chuẩn YYYY-MM-DD
    const todayISO = useMemo(() => getTodayLocalISO(), []);

    useEffect(() => {
        // Modal chỉ hiện ra nếu:
        // 1. Profile trong DB đã đánh dấu hoàn thành ngày hôm nay (do DataStore kích hoạt)
        // 2. State cục bộ chưa hiển thị Modal này (tránh lặp lại)
        if (user?.last_completed_date === todayISO && hasShownStreakSuccessToday !== todayISO) {
            console.log("[STREAK UI] Victory detected! Showing modal...");
            setStreakShownToday(todayISO);
            setIsOpen(true);
        }
    }, [user?.last_completed_date, todayISO, hasShownStreakSuccessToday, setStreakShownToday]);

    // Lấy số lượng nhiệm vụ của hôm nay để hiển thị thông báo chính xác
    const todayTaskCount = useMemo(() => {
        const now = new Date();
        const todayLabel = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        return tasks.filter(t => t.due_date && t.due_date.split(' ')[0] === todayLabel).length;
    }, [tasks]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/85 backdrop-blur-3xl animate-fade-in">
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[48px] shadow-2xl overflow-hidden relative border border-white/20 animate-fade-in-up">
                {/* Trang trí */}
                <div className="absolute top-0 left-0 w-full h-44 bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 opacity-25"></div>
                <div className="absolute top-10 right-10 w-32 h-32 bg-orange-500/30 rounded-full blur-[60px] animate-pulse"></div>
                
                <div className="p-10 flex flex-col items-center text-center relative z-10">
                    <div className="w-28 h-28 bg-gradient-to-tr from-orange-500 to-rose-600 rounded-[38px] flex items-center justify-center shadow-2xl shadow-rose-500/50 mb-8 transform rotate-6 scale-110">
                        <span className="material-symbols-outlined text-white text-[64px] fill-1">local_fire_department</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <span className="material-symbols-outlined text-[16px] animate-bounce">auto_awesome</span>
                        Mục tiêu rực cháy
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                        Chuỗi {user?.streak || 0} ngày!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-10 px-2 font-medium">
                        {todayTaskCount > 0 
                            ? `Phi thường! Bạn đã chinh phục toàn bộ ${todayTaskCount} nhiệm vụ hôm nay.`
                            : "Phong độ là nhất thời, đẳng cấp là mãi mãi. Hãy giữ vững chuỗi nhé!"
                        }
                    </p>

                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-5 rounded-[28px] shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                        <span>TIẾP TỤC DUY TRÌ!</span>
                        <span className="material-symbols-outlined text-[18px] fill-1">bolt</span>
                    </button>
                    
                    <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Hệ thống đã ghi nhận thành công</p>
                </div>
            </div>
        </div>
    );
};
