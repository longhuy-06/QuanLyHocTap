
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../lib/store/dataStore';
import { TaskStatus } from '../types';
import { useAuthStore } from '../lib/store/authStore';

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, subjects, updateTaskStatus, deleteTask } = useDataStore();
  const { user } = useAuthStore();
  
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const parseTaskDate = (dateStr: string) => {
      if (!dateStr) return null;
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return null;
  };

  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const selectedDateTasks = useMemo(() => tasks.filter(t => {
      const tDate = parseTaskDate(t.due_date);
      return tDate && isSameDay(tDate, selectedDate);
  }), [tasks, selectedDate]);

  const daysStatus = useMemo(() => {
      const statusMap = new Map<number, { total: number; done: number }>();
      tasks.forEach(t => {
          const tDate = parseTaskDate(t.due_date);
          if (tDate && tDate.getMonth() === viewDate.getMonth() && tDate.getFullYear() === viewDate.getFullYear()) {
              const day = tDate.getDate();
              const current = statusMap.get(day) || { total: 0, done: 0 };
              statusMap.set(day, { total: current.total + 1, done: current.done + (t.status === TaskStatus.DONE ? 1 : 0) });
          }
      });
      return statusMap;
  }, [tasks, viewDate]);

  const notifications = useMemo(() => {
    const alerts: any[] = [];
    const now = new Date();
    
    const todayTasks = tasks.filter(t => {
        const tDate = parseTaskDate(t.due_date);
        return tDate && isSameDay(tDate, now);
    });

    const completedToday = todayTasks.filter(t => t.status === TaskStatus.DONE).length;
    const totalToday = todayTasks.length;

    if (totalToday > 0) {
        alerts.push({
            id: 'summary-today',
            title: 'Tiến độ hôm nay',
            message: `Hoàn thành ${completedToday}/${totalToday} nhiệm vụ.`,
            time: 'Hôm nay',
            read: false,
            type: 'summary'
        });
    }

    // Báo trước cho ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTasks = tasks.filter(t => {
        const tDate = parseTaskDate(t.due_date);
        return tDate && isSameDay(tDate, tomorrow) && t.status !== TaskStatus.DONE;
    });

    if (tomorrowTasks.length > 0) {
        alerts.push({
            id: 'upcoming-alert',
            title: 'Báo trước cho ngày mai',
            message: `Bạn có ${tomorrowTasks.length} nhiệm vụ cần giải quyết vào ngày mai.`,
            time: 'Sắp tới',
            read: false,
            type: 'alert'
        });
    }

    return alerts;
  }, [tasks]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDeleteTask = (id: string) => {
      if (window.confirm("Xóa nhiệm vụ này khỏi lịch?")) {
          deleteTask(id);
      }
  };

  return (
    <div className="pb-32 pt-4 px-4 min-h-screen bg-background-light dark:bg-background-dark">
       <div className="flex items-center justify-between mb-8 sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl py-3 px-1">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-glow">
                  <span className="material-symbols-outlined text-[24px]">calendar_today</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Học Tập</h1>
          </div>

          <div className="flex gap-4 relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-400 p-1">
                  <span className="material-symbols-outlined text-[26px]">notifications</span>
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark animate-pulse"></span>}
              </button>
               <div onClick={() => navigate('/settings')} className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer">
                  <img src={user?.avatar_url || "https://picsum.photos/200?study"} alt="AVT" className="w-full h-full object-cover" />
               </div>

               {showNotifications && (
                   <div className="absolute right-0 top-14 w-80 bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                       <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                           <span className="text-sm font-black uppercase tracking-widest text-gray-400">Thông báo</span>
                       </div>
                       <div className="max-h-[450px] overflow-y-auto p-2 space-y-2">
                           {notifications.length > 0 ? notifications.map((n) => (
                               <div key={n.id} className={`p-4 rounded-2xl flex flex-col gap-2 ${n.type === 'summary' ? 'bg-indigo-500 text-white' : n.type === 'alert' ? 'bg-orange-500 text-white' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                                   <div className="flex gap-3">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                           n.type === 'alert' ? 'bg-white/20 text-white' : 
                                           n.type === 'summary' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-500'
                                       }`}>
                                           <span className="material-symbols-outlined text-[16px] font-bold">
                                               {n.type === 'alert' ? 'bolt' : 
                                                n.type === 'summary' ? 'analytics' : 'info'}
                                           </span>
                                       </div>
                                       <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black truncate">{n.title}</h4>
                                            <p className="text-xs mt-1 opacity-80">{n.message}</p>
                                       </div>
                                   </div>
                               </div>
                           )) : (
                               <p className="text-center py-4 text-xs text-gray-400 font-bold">Không có thông báo mới</p>
                           )}
                       </div>
                   </div>
               )}
          </div>
       </div>
       
       <div className="flex h-12 w-full bg-white dark:bg-surface-dark rounded-full p-1.5 mb-8 border border-gray-100 dark:border-gray-800 shadow-soft">
          <button onClick={() => setViewMode('month')} className={`flex-1 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400'}`}>Tháng</button>
          <button onClick={() => setViewMode('year')} className={`flex-1 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400'}`}>Năm</button>
       </div>

       <div className="bg-white dark:bg-surface-dark rounded-[40px] shadow-soft p-6 mb-8 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8 px-2">
             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_left</span></button>
             <span className="text-lg font-black text-gray-900 dark:text-white">
                 {`Tháng ${viewDate.getMonth() + 1}, ${viewDate.getFullYear()}`}
             </span>
             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-gray-400">chevron_right</span></button>
          </div>

          <div className="grid grid-cols-7 gap-y-6 gap-x-1 text-center animate-fade-in-up">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => <div key={d} className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{d}</div>)}
              {Array.from({ length: (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() || 7) - 1 }).map((_, i) => <div key={`e-${i}`} className="h-10"></div>)}
              {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(d => {
                const curr = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                const isSel = isSameDay(curr, selectedDate);
                const stats = daysStatus.get(d);
                const isToday = isSameDay(curr, new Date());
                let bg = 'text-gray-700 dark:text-gray-300';
                if (stats) {
                    bg = stats.done === stats.total ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white';
                }
                return (
                    <div key={d} onClick={() => setSelectedDate(curr)} className="flex flex-col items-center cursor-pointer relative">
                        <span className={`flex items-center justify-center w-10 h-10 text-sm font-black rounded-2xl transition-all ${bg} ${isSel ? 'ring-4 ring-primary/20 scale-110 shadow-xl' : ''} ${isToday && !stats ? 'border-2 border-primary' : ''}`}>{d}</span>
                    </div>
                );
              })}
          </div>
       </div>

       <div className="space-y-4 px-2">
          <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Nhiệm vụ {selectedDate.getDate()}/{selectedDate.getMonth() + 1}</h2>
          </div>
          {selectedDateTasks.length === 0 ? (
              <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trống lịch học</p>
              </div>
          ) : (
              selectedDateTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-5 rounded-[32px] bg-white dark:bg-surface-dark shadow-soft border border-transparent hover:border-primary/20 transition-all group">
                    <button onClick={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200'}`}>{task.status === TaskStatus.DONE && <span className="material-symbols-outlined text-sm font-bold">check</span>}</button>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-[15px] font-black truncate ${task.status === TaskStatus.DONE ? 'text-gray-400 line-through' : ''}`}>{task.title}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{task.due_date?.split(' ')[1] || '23:59'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        <div className="w-2 h-10 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === task.subject_id)?.color || '#eee' }}></div>
                    </div>
                </div>
              ))
          )}
       </div>
    </div>
  );
};
