import { useMemo, useEffect, useState } from 'react';
import { useDataStore } from '../lib/store/dataStore';
import { useAuthStore } from '../lib/store/authStore';
import { TaskStatus } from '../types';

export const StreakSuccessModal: React.FC = () => {
    const { tasks, hasShownStreakSuccessToday, setStreakShownToday } = useDataStore();
    const { user, incrementStreak } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const todayLabel = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Lấy số lượng nhiệm vụ của hôm nay
    const todayTasks = useMemo(() => tasks.filter(t => t.dueDate?.startsWith(todayLabel)), [tasks, todayLabel]);
    const todayTasksCount = todayTasks.length;
    const studyTimeToday = user?.studySessions?.[today] || 0;

    const canIncrementStreak = useMemo(() => {
        if (hasShownStreakSuccessToday === today) return false;

        if (todayTasksCount > 0) {
            // 1. Nếu CÓ nhiệm vụ: Phải xong hết mới được tăng
            return todayTasks.every(t => t.status === TaskStatus.DONE);
        } else {
            // 2. Nếu KHÔNG CÓ nhiệm vụ: Phải ở trong app ít nhất 5 phút
            return studyTimeToday >= 5;
        }
    }, [todayTasks, todayTasksCount, studyTimeToday, hasShownStreakSuccessToday, today]);

    useEffect(() => {
        if (canIncrementStreak) {
            setIsOpen(true);
            incrementStreak();
            setStreakShownToday(today);
        }
    }, [canIncrementStreak, today, incrementStreak, setStreakShownToday]);

    // Trạng thái hiển thị thông báo "đang chờ" nếu là ngày trống và chưa đủ 5p
    const [showWaitingTip, setShowWaitingTip] = useState(false);
    useEffect(() => {
        if (todayTasksCount === 0 && studyTimeToday < 5 && hasShownStreakSuccessToday !== today) {
            const timer = setTimeout(() => setShowWaitingTip(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setShowWaitingTip(false);
        }
    }, [todayTasksCount, studyTimeToday, hasShownStreakSuccessToday, today]);

    if (!isOpen) {
        if (showWaitingTip) {
            return (
                <div className="fixed top-24 right-4 z-[100] w-48 animate-fade-in">
                    <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border border-primary/10 p-2 rounded-xl shadow-float flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[16px] animate-spin">hourglass_top</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate">Duy trì chuỗi</p>
                            <p className="text-[9px] text-gray-500 font-bold truncate">Còn {5 - studyTimeToday}p nữa</p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fade-in-up">
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative border border-white/20">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-500 to-amber-500 opacity-20"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                
                <div className="p-8 flex flex-col items-center text-center relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-orange-500/30 mb-6 rotate-3 transform transition-transform hover:rotate-0">
                        <span className="material-symbols-outlined text-white text-[56px] fill-1">local_fire_department</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        {todayTasksCount > 0 ? "Mục tiêu hoàn thành" : "Duy trì rực cháy"}
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        {todayTasksCount > 0 ? "Giữ chuỗi thành công!" : "Chuỗi vẫn rực cháy!"}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                        {todayTasksCount > 0 
                            ? `Thật tuyệt vời! Bạn đã hoàn thành tất cả nhiệm vụ hôm nay. Chuỗi của bạn đã tăng lên ${user?.streak} ngày.`
                            : `Hôm nay bạn không có lịch học nhưng đã dành thời gian ghé thăm Huy Long. Chuỗi của bạn vẫn được duy trì: ${user?.streak} ngày.`
                        }
                    </p>

                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-5 rounded-[24px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                    >
                        Tuyệt vời, tiếp tục thôi!
                    </button>
                    
                    <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hẹn gặp lại vào ngày mai</p>
                </div>
            </div>
        </div>
    );
};
