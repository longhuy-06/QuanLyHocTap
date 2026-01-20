
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
  const { tasks, subjects, updateTaskStatus, deleteTask, documents } = useDataStore();
  
  const [activePerformanceDate, setActivePerformanceDate] = useState(new Date());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const searchResults = useMemo(() => {
      if (!searchQuery.trim()) return { docs: [], tasks: [] };
      const query = searchQuery.toLowerCase();
      return {
          docs: documents.filter(d => d.title.toLowerCase().includes(query)),
          tasks: tasks.filter(t => t.title.toLowerCase().includes(query))
      };
  }, [searchQuery, documents, tasks]);

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
    <div className="pb-32 pt-6 px-5 max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen relative">
       <header className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/settings')}
                className="w-14 h-14 rounded-[22px] bg-primary overflow-hidden shadow-lg shadow-primary/20 active:scale-90 transition-all border-2 border-white dark:border-gray-800"
              >
                  <img src={user?.avatar_url || "https://picsum.photos/200"} className="w-full h-full object-cover" alt="Profile" />
              </button>
              <div>
                  <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Học Tập</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chào {user?.name.split(' ')[0]}!</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-surface-dark shadow-soft flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
              >
                  <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                  <span className="material-symbols-outlined text-orange-500 fill-1 text-[20px]">local_fire_department</span>
                  <span className="font-black text-orange-600 dark:text-orange-400 text-sm">{user?.streak || 0}</span>
              </div>
          </div>
       </header>

       {isSearchOpen && (
           <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md p-4 animate-fade-in flex flex-col items-center pt-20">
               <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up">
                   <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                       <span className="material-symbols-outlined text-gray-400">search</span>
                       <input 
                         autoFocus
                         type="text" 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         placeholder="Tìm tài liệu hoặc nhiệm vụ..."
                         className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-sm"
                       />
                       <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-1 text-gray-400 hover:text-red-500">
                           <span className="material-symbols-outlined">close</span>
                       </button>
                   </div>
                   <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
                       {searchQuery.trim() ? (
                           <>
                               {searchResults.docs.length > 0 && (
                                   <section>
                                       <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tài liệu</p>
                                       {searchResults.docs.map(doc => (
                                           <div key={doc.id} onClick={() => { navigate('/documents'); setIsSearchOpen(false); }} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl flex items-center gap-3 cursor-pointer group">
                                               <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                   <span className="material-symbols-outlined text-[20px]">description</span>
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                   <p className="text-sm font-bold truncate">{doc.title}</p>
                                                   <p className="text-[10px] text-gray-400">{doc.upload_date}</p>
                                               </div>
                                           </div>
                                       ))}
                                   </section>
                               )}
                               {searchResults.tasks.length > 0 && (
                                   <section>
                                       <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhiệm vụ</p>
                                       {searchResults.tasks.map(task => (
                                           <div key={task.id} onClick={() => { navigate('/kanban'); setIsSearchOpen(false); }} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl flex items-center gap-3 cursor-pointer group">
                                               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                   <span className="material-symbols-outlined text-[20px]">task_alt</span>
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                   <p className="text-sm font-bold truncate">{task.title}</p>
                                                   <p className="text-[10px] text-gray-400">{task.due_date}</p>
                                               </div>
                                           </div>
                                       ))}
                                   </section>
                               )}
                               {searchResults.docs.length === 0 && searchResults.tasks.length === 0 && (
                                   <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Không có kết quả</div>
                               )}
                           </>
                       ) : (
                           <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nhập từ khóa để tìm kiếm</div>
                       )}
                   </div>
               </div>
           </div>
       )}

       <Pomodoro />

       <div className="mt-8 space-y-8">
          <section className="bg-gradient-to-br from-indigo-600 to-primary rounded-[32px] p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden group cursor-pointer animate-fade-in-up" onClick={() => navigate('/documents')}>
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <h3 className="text-white text-lg font-black">Kho tài liệu</h3>
                   <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{documents.length} tệp đã lưu trữ</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                   <span className="material-symbols-outlined text-[28px]">folder_shared</span>
                </div>
             </div>
          </section>

          <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-soft animate-fade-in-up">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {isFuture ? "Dự báo" : "Hiệu suất"} {activePerformanceDate.getDate()}/{activePerformanceDate.getMonth()+1}
                   </h3>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
                    <button type="button" onClick={() => handleDayShift(-1)} className="p-1.5 text-gray-400 active:scale-90 transition-transform"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                    <span className="text-[10px] font-black px-2 w-16 text-center">{activePerformanceDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                    <button type="button" onClick={() => handleDayShift(1)} className="p-1.5 text-gray-400 active:scale-90 transition-transform"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="w-28 h-28 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} innerRadius={40} outerRadius={52} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black">{stats.totalTasks > 0 ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0}%</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl">
                        <span className="material-symbols-outlined text-primary text-[18px]">assignment_turned_in</span>
                        <p className="text-[13px] font-black">{stats.completedTasks}/{stats.totalTasks}</p>
                    </div>
                    {!isFuture && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-2xl">
                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">schedule</span>
                            <p className="text-[13px] font-black">{Math.floor(stats.totalMinutes/60)}h{stats.totalMinutes%60}m</p>
                        </div>
                    )}
                </div>
             </div>
          </section>

          <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Nhiệm vụ hôm nay</h3>
                  <button onClick={() => navigate('/kanban')} className="text-[10px] font-black text-primary uppercase tracking-widest">Tất cả</button>
              </div>
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
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Trống lịch</p>
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
        className={`bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-soft flex items-center justify-between gap-3 border border-transparent transition-all hover:border-primary/20 ${task.status === TaskStatus.DONE ? 'opacity-60' : ''}`}
        onClick={onEdit}
    >
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onComplete(); }} 
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-all active:scale-90 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-100 dark:border-gray-700 text-gray-300'}`}
            >
                <span className="material-symbols-outlined text-[22px]">{task.status === TaskStatus.DONE ? 'check' : 'circle'}</span>
            </button>
            <div className="flex-1 min-w-0">
                <h4 className={`text-[15px] font-black truncate ${task.status === TaskStatus.DONE ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{subjects.find(s => s.id === task.subject_id)?.name || 'Khác'}</p>
                </div>
            </div>
        </div>
        <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shrink-0"
        >
            <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
    </div>
);
