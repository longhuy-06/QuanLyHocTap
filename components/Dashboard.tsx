
import React, { useEffect, useMemo, useState } from 'react';
import { Pomodoro } from './Pomodoro';
import { ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useAuthStore } from '../lib/store/authStore';
import { useDataStore } from '../lib/store/dataStore';
import { TaskStatus, Task } from '../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkStreakValidity } = useAuthStore();
  const { tasks, subjects, updateTaskStatus, deleteTask } = useDataStore();
  
  const [activePerformanceDate, setActivePerformanceDate] = useState(new Date());

  // Kiểm tra chuỗi ngay khi vào Dashboard
  useEffect(() => {
      if (tasks.length > 0) {
          checkStreakValidity(tasks);
      }
  }, [checkStreakValidity, tasks]);

  const getFormattedDate = (date: Date) => {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const stats = useMemo(() => {
      const selectedDayLabel = getFormattedDate(activePerformanceDate);
      const dailyTasks = tasks.filter(t => t.due_date?.split(' ')[0] === selectedDayLabel);
      
      const totalTasks = dailyTasks.length;
      const completedTasks = dailyTasks.filter(t => t.status === TaskStatus.DONE).length;
      
      const dateKey = getLocalDateKey(activePerformanceDate);
      const totalMinutes = user?.study_sessions?.[dateKey] || 0;

      return { totalTasks, completedTasks, totalMinutes, dailyTasks };
  }, [tasks, activePerformanceDate, user]);

  const pieData = [
    { name: 'Xong', value: stats.completedTasks || (stats.totalTasks === 0 ? 0 : 0.0001), color: '#5048e5' },
    { name: 'Còn lại', value: (stats.totalTasks - stats.completedTasks) || (stats.totalTasks === 0 ? 1 : 0), color: '#f3f4f6' }
  ];

  const handleDayShift = (days: number) => {
      const newDate = new Date(activePerformanceDate);
      newDate.setDate(newDate.getDate() + days);
      setActivePerformanceDate(newDate);
  };

  const isFuture = activePerformanceDate.getTime() > new Date().setHours(23, 59, 59, 999);

  return (
    <div className="pb-32 pt-6 px-5 max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen">
       <header className="flex flex-col gap-2 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow">
                      <span className="material-symbols-outlined text-[28px] font-bold">menu_book</span>
                  </div>
                  <div>
                      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Học Tập</h1>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Chào {user?.name.split(' ')[0]}!</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                  <span className="material-symbols-outlined text-orange-500 fill-1">local_fire_department</span>
                  <span className="font-black text-orange-600 dark:text-orange-400">{user?.streak || 0} ngày</span>
              </div>
          </div>
       </header>

       <Pomodoro />

       <div className="mt-8 space-y-8">
          <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-soft animate-fade-in-up">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {isFuture ? "Dự báo ngày" : "Hiệu suất ngày"} {activePerformanceDate.getDate()}/{activePerformanceDate.getMonth()+1}
                   </h3>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
                    <button type="button" onClick={() => handleDayShift(-1)} className="p-1.5 text-gray-400 active:scale-90 transition-transform"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                    <span className="text-[10px] font-black px-2 w-20 text-center">{activePerformanceDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                    <button type="button" onClick={() => handleDayShift(1)} className="p-1.5 text-gray-400 active:scale-90 transition-transform"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                </div>
             </div>

             <div className="flex items-center gap-8">
                <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} innerRadius={45} outerRadius={58} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black">{stats.totalTasks > 0 ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0}%</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase">{isFuture ? 'MỤC TIÊU' : 'TIẾN ĐỘ'}</span>
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl">
                        <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Nhiệm vụ</p>
                            <p className="text-base font-black">{stats.completedTasks}/{stats.totalTasks}</p>
                        </div>
                    </div>
                    {!isFuture && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-2xl">
                            <span className="material-symbols-outlined text-emerald-500 text-[20px]">schedule</span>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Thời gian học</p>
                                <p className="text-base font-black">{Math.floor(stats.totalMinutes/60)}h{stats.totalMinutes%60}m</p>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </section>

          <section className="space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white px-2">Danh sách nhiệm vụ</h3>
              <div className="space-y-3">
                  {stats.dailyTasks.length > 0 ? (
                      stats.dailyTasks.map(task => (
                          <TaskRow 
                            key={task.id} 
                            task={task} 
                            subjects={subjects} 
                            onComplete={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)} 
                            onDelete={() => { if(confirm("Xóa nhiệm vụ này?")) deleteTask(task.id); }}
                            onEdit={() => navigate(`/kanban`)}
                          />
                      ))
                  ) : (
                      <div className="p-8 text-center bg-gray-50/30 dark:bg-gray-800/10 rounded-[28px] border border-dashed border-gray-100 dark:border-gray-800/30">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Trống lịch cho ngày này</p>
                      </div>
                  )}
              </div>
          </section>
       </div>
    </div>
  );
};

const TaskRow: React.FC<{ task: any, subjects: any[], onComplete: () => void, onDelete: () => void, onEdit: () => void }> = ({ task, subjects, onComplete, onDelete, onEdit }) => (
    <div 
        className={`bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-soft flex items-center justify-between group border border-transparent transition-all hover:border-primary/20 ${task.status === TaskStatus.DONE ? 'opacity-60' : ''}`}
        onClick={onEdit}
    >
        <div className="flex items-center gap-4 flex-1">
            <div className="w-1.5 h-10 rounded-full" style={{backgroundColor: subjects.find(s => s.id === task.subject_id)?.color || '#9ca3af'}}></div>
            <div className="flex-1 min-w-0">
                <h4 className={`text-[15px] font-black truncate ${task.status === TaskStatus.DONE ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{subjects.find(s => s.id === task.subject_id)?.name || 'Khác'}</p>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <span className="text-[10px] font-bold text-primary">{task.due_date.split(' ')[1] || 'Cả ngày'}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button 
                type="button"
                onClick={onDelete}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
                <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button 
                type="button"
                onClick={onComplete} 
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-100 dark:border-gray-700 text-gray-300 hover:text-emerald-500 hover:border-emerald-500'}`}
            >
                <span className="material-symbols-outlined text-[22px]">{task.status === TaskStatus.DONE ? 'check' : 'check_circle'}</span>
            </button>
        </div>
    </div>
);
